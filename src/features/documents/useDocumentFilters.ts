import { useState, useMemo } from "react";
import { DocumentItem } from "./useDocuments";

export type DocumentCategory = DocumentItem['category'] | 'all';
export type PrivacyFilter = 'all' | 'private' | 'shared';
export type SortOption = 'recent' | 'oldest' | 'alphabetical';

export interface DocumentFilters {
    category: DocumentCategory;
    privacy: PrivacyFilter;
    sort: SortOption;
    selectedTags: string[];
}

export const useDocumentFilters = () => {
    const [filters, setFilters] = useState<DocumentFilters>({
        category: 'all',
        privacy: 'all',
        sort: 'recent',
        selectedTags: [],
    });

    const updateFilter = <K extends keyof DocumentFilters>(
        key: K,
        value: DocumentFilters[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const toggleTag = (tag: string) => {
        setFilters(prev => ({
            ...prev,
            selectedTags: prev.selectedTags.includes(tag)
                ? prev.selectedTags.filter(t => t !== tag)
                : [...prev.selectedTags, tag],
        }));
    };

    const clearFilters = () => {
        setFilters({
            category: 'all',
            privacy: 'all',
            sort: 'recent',
            selectedTags: [],
        });
    };

    const hasActiveFilters = useMemo(() => {
        return (
            filters.category !== 'all' ||
            filters.privacy !== 'all' ||
            filters.sort !== 'recent' ||
            filters.selectedTags.length > 0
        );
    }, [filters]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.category !== 'all') count++;
        if (filters.privacy !== 'all') count++;
        if (filters.sort !== 'recent') count++;
        count += filters.selectedTags.length;
        return count;
    }, [filters]);

    return {
        filters,
        updateFilter,
        toggleTag,
        clearFilters,
        hasActiveFilters,
        activeFiltersCount,
    };
};

export const filterDocuments = (
    documents: DocumentItem[],
    filters: DocumentFilters
): DocumentItem[] => {
    let filtered = [...documents];

    // Filter by category
    if (filters.category !== 'all') {
        filtered = filtered.filter(doc => doc.category === filters.category);
    }

    // Filter by privacy
    if (filters.privacy === 'private') {
        filtered = filtered.filter(doc => doc.is_private);
    } else if (filters.privacy === 'shared') {
        filtered = filtered.filter(doc => !doc.is_private);
    }

    // Filter by tags
    if (filters.selectedTags.length > 0) {
        filtered = filtered.filter(doc =>
            doc.keywords?.some(keyword =>
                filters.selectedTags.includes(keyword)
            )
        );
    }

    // Sort
    switch (filters.sort) {
        case 'recent':
            filtered.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            break;
        case 'oldest':
            filtered.sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            break;
        case 'alphabetical':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }

    return filtered;
};
