# Guia de Contribuição

## Arquitetura do Projeto

### Estrutura de Pastas

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui base
│   ├── layout/          # Header, BottomNav, MainLayout
│   └── tasks/           # TaskCard, TaskList
├── features/
│   ├── auth/            # Autenticação e AuthProvider
│   ├── tasks/           # Lógica de tarefas e hooks
│   ├── gamification/    # Pontos, histórico, ranking
│   └── rewards/         # Sistema de prêmios
├── hooks/               # Custom hooks (use-toast)
├── lib/                 # Supabase client e utils
└── types/               # TypeScript types
```

### Padrões de Código

#### 1. Hooks do React Query

Use o padrão `useXQuery` para queries e `useXMutation` para mutations:

```typescript
// Exemplo: features/tasks/useTasksQuery.ts
export function useTasksQuery() {
  return useQuery({
    queryKey: ["tasks", "today"],
    queryFn: async () => {
      // fetch logic
    },
  });
}
```

#### 2. Optimistic UI

Sempre implemente optimistic updates para melhor UX:

```typescript
export function useMutation() {
  return useMutation({
    onMutate: async (variables) => {
      // Snapshot estado anterior
      const previous = queryClient.getQueryData(...)

      // Atualização otimista
      queryClient.setQueryData(...)

      return { previous }
    },
    onError: (err, variables, context) => {
      // Rollback
      queryClient.setQueryData(..., context.previous)
    },
  })
}
```

#### 3. Mobile-First

Sempre pense mobile-first:

- Use a classe `thumb-friendly` para botões importantes
- Prefira Bottom Sheets ao invés de modais
- Teste em dispositivos reais sempre que possível

#### 4. TypeScript

- Use tipos do Supabase via `Database` type
- Evite `any` - prefira `unknown` se necessário
- Defina interfaces para componentes complexos

### Convenções

- **Componentes:** PascalCase (`TaskCard.tsx`)
- **Hooks:** camelCase começando com `use` (`useTasksQuery.ts`)
- **Arquivos utilitários:** camelCase (`utils.ts`)
- **Constantes:** UPPER_SNAKE_CASE

### Commits

Use mensagens descritivas:

- ✨ `feat: adiciona filtro por categoria nas tarefas`
- 🐛 `fix: corrige bug no cálculo de pontos`
- 📝 `docs: atualiza guia de setup`
- 💄 `style: melhora espaçamento nos cards`
- ♻️ `refactor: simplifica lógica de recorrência`

### Testando Localmente

1. Sempre teste com network throttling
2. Teste o Optimistic UI desconectando a internet
3. Verifique se não há erros no console
4. Teste em diferentes resoluções

### Adicionando Novas Features

1. Crie os tipos no `types/database.ts`
2. Adicione migrations SQL em `supabase/migrations/`
3. Crie hooks no diretório apropriado de `features/`
4. Crie componentes necessários
5. Atualize a documentação

### Pull Requests

- Descreva claramente o que foi alterado
- Adicione screenshots/GIFs se mudanças visuais
- Garanta que não há linting errors
- Teste em mobile e desktop
