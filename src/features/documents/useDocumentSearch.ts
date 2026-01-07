import { useMemo } from "react";
import Fuse from "fuse.js";
import { DocumentItem } from "./useDocuments";
import { getCategoryConfig } from "./categoryConfig";

export interface SearchableDocument extends DocumentItem {
    // Campos computados para busca
    categoryLabel: string;
    keywordsText: string;
}

/**
 * Hook para busca híbrida de documentos usando Fuse.js
 * Combina busca por tokens com fuzzy matching para melhor experiência
 */
export const useDocumentSearch = (documents: DocumentItem[] | undefined, searchQuery: string) => {
    // Preparar documentos com campos computados para busca
    const searchableDocuments = useMemo<SearchableDocument[]>(() => {
        if (!documents) return [];

        return documents.map(doc => ({
            ...doc,
            categoryLabel: getCategoryConfig(doc.category).label,
            keywordsText: doc.keywords?.join(' ') || '',
        }));
    }, [documents]);

    // Configurar Fuse.js
    const fuse = useMemo(() => {
        return new Fuse(searchableDocuments, {
            keys: [
                {
                    name: 'title',
                    weight: 3, // Título tem peso maior
                },
                {
                    name: 'keywordsText',
                    weight: 2, // Keywords tem peso médio-alto
                },
                {
                    name: 'description',
                    weight: 1.5, // Descrição tem peso médio
                },
                {
                    name: 'categoryLabel',
                    weight: 1, // Categoria tem peso menor
                },
            ],
            // Configurações de fuzzy matching
            threshold: 0.4, // 0 = exact match, 1 = match anything (0.4 é um bom balanço)
            distance: 100, // Distância máxima para considerar match
            minMatchCharLength: 2, // Mínimo de caracteres para considerar
            ignoreLocation: true, // Ignora onde a palavra aparece no texto
            useExtendedSearch: true, // Permite operadores especiais
            includeScore: true, // Inclui score de relevância
            includeMatches: true, // Inclui informação sobre o que deu match
        });
    }, [searchableDocuments]);

    // Realizar busca
    const searchResults = useMemo(() => {
        if (!searchQuery || searchQuery.trim().length === 0) {
            return searchableDocuments;
        }

        const trimmedQuery = searchQuery.trim();

        // Busca por tokens (palavras separadas)
        // Divide a query em palavras e busca cada uma
        const tokens = trimmedQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);

        if (tokens.length === 0) {
            return searchableDocuments;
        }

        // Se for apenas uma palavra, usa busca fuzzy direta
        if (tokens.length === 1) {
            const results = fuse.search(trimmedQuery);
            return results.map(result => result.item);
        }

        // Para múltiplas palavras, usa busca AND (todas devem estar presentes)
        // Cria uma query extendida do Fuse.js: 'word1 'word2 'word3
        const extendedQuery = tokens.map(token => `'${token}`).join(' ');
        const results = fuse.search(extendedQuery);

        // Se não encontrou nada com busca estrita, tenta busca mais flexível
        if (results.length === 0) {
            // Busca OR (qualquer palavra)
            const orResults = fuse.search(tokens.join(' | '));
            return orResults.map(result => result.item);
        }

        return results.map(result => result.item);
    }, [fuse, searchQuery, searchableDocuments]);

    // Informações sobre a busca
    const searchInfo = useMemo(() => {
        const hasQuery = searchQuery && searchQuery.trim().length > 0;
        const tokens = hasQuery ? searchQuery.trim().toLowerCase().split(/\s+/).filter(t => t.length > 0) : [];

        return {
            hasQuery,
            tokens,
            tokenCount: tokens.length,
            resultCount: searchResults.length,
            totalCount: searchableDocuments.length,
        };
    }, [searchQuery, searchResults.length, searchableDocuments.length]);

    return {
        results: searchResults,
        searchInfo,
    };
};

/**
 * Função helper para destacar termos de busca no texto
 * Útil para mostrar ao usuário o que deu match
 */
export const highlightSearchTerms = (text: string, searchQuery: string): string => {
    if (!searchQuery || !text) return text;

    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    let highlightedText = text;

    tokens.forEach(token => {
        const regex = new RegExp(`(${token})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return highlightedText;
};
