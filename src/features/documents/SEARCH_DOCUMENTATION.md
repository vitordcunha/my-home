# Busca Híbrida de Documentos

## 📖 Visão Geral

A busca de documentos utiliza uma abordagem híbrida que combina:
1. **Busca por Tokens** - Divide a query em palavras individuais
2. **Fuzzy Matching** - Tolera pequenos erros de digitação
3. **Busca Ponderada** - Campos diferentes têm pesos diferentes
4. **Busca Multi-campo** - Procura em título, tags, descrição e categoria

## 🔍 Como Funciona

### Exemplo de Busca

**Query:** `"documentos greicy pagamento"`

**Processamento:**
1. Divide em tokens: `["documentos", "greicy", "pagamento"]`
2. Busca cada palavra em múltiplos campos
3. Retorna documentos que contêm **todas** as palavras (AND lógico)
4. Ordena por relevância

### Campos de Busca (com pesos)

| Campo | Peso | Descrição |
|-------|------|-----------|
| `title` | 3.0 | Título do documento (maior peso) |
| `keywords` | 2.0 | Tags/palavras-chave |
| `description` | 1.5 | Descrição/resumo |
| `categoryLabel` | 1.0 | Categoria traduzida |

## 🎯 Exemplos de Uso

### Busca Simples
```
"conta luz" → Encontra documentos com "conta" E "luz"
```

### Busca Multi-palavra
```
"greicy pagamento energia" → Encontra documentos que contêm todas as 3 palavras
```

### Busca com Typos (Fuzzy)
```
"greici pagament" → Encontra "greicy pagamento" (tolera erros)
```

### Ordem Não Importa
```
"pagamento greicy" = "greicy pagamento"
```

## ⚙️ Configuração Fuse.js

```typescript
{
  threshold: 0.4,           // 0 = exact, 1 = match anything
  distance: 100,            // Distância máxima para match
  minMatchCharLength: 2,    // Mínimo de caracteres
  ignoreLocation: true,     // Ignora posição no texto
  useExtendedSearch: true,  // Permite operadores
  includeScore: true,       // Score de relevância
  includeMatches: true      // Info sobre matches
}
```

## 🚀 Performance

- **Client-side**: Busca acontece no navegador
- **Instantânea**: Sem delay de rede
- **Escalável**: Funciona bem até ~1000 documentos
- **Sem backend**: Não precisa de API adicional

## 💡 Melhorias Futuras

### Possíveis Adições:
1. **Busca por operadores**
   - `tag:pagamento` - Busca específica em tags
   - `categoria:conta` - Busca por categoria
   - `-palavra` - Excluir palavra

2. **Highlight de resultados**
   - Destacar palavras encontradas nos cards

3. **Histórico de buscas**
   - Salvar buscas recentes no localStorage

4. **Autocomplete**
   - Sugerir termos enquanto digita

5. **Busca por criador**
   - Adicionar nome do usuário que criou o documento

## 🔧 Manutenção

### Ajustar Sensibilidade
Para busca mais estrita, diminua `threshold`:
```typescript
threshold: 0.2  // Mais estrito
```

Para busca mais flexível, aumente `threshold`:
```typescript
threshold: 0.6  // Mais flexível
```

### Ajustar Pesos
Para dar mais importância a um campo:
```typescript
{
  name: 'title',
  weight: 5,  // Aumenta importância do título
}
```

## 📊 Métricas

O hook `useDocumentSearch` retorna:
```typescript
{
  results: DocumentItem[],     // Documentos filtrados
  searchInfo: {
    hasQuery: boolean,          // Se há busca ativa
    tokens: string[],           // Palavras da busca
    tokenCount: number,         // Quantidade de palavras
    resultCount: number,        // Documentos encontrados
    totalCount: number,         // Total de documentos
  }
}
```

## 🎨 Componentes

### `useDocumentSearch`
Hook principal de busca

### `SearchInfoBadge`
Badge visual mostrando estatísticas da busca

### Integração
```tsx
const { results, searchInfo } = useDocumentSearch(documents, searchQuery);

<SearchInfoBadge
  tokenCount={searchInfo.tokenCount}
  resultCount={searchInfo.resultCount}
  totalCount={searchInfo.totalCount}
/>
```
