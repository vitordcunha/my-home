# Nossa Casa - PWA para Gestão Doméstica

Progressive Web App para gestão doméstica gamificada com Optimistic UI.

## Stack Técnica

- **Frontend:** Vite + React + TypeScript
- **Estilização:** Tailwind CSS + shadcn/ui (Mobile-First)
- **Backend & Database:** Supabase (PostgreSQL, Auth, RLS)
- **Data Fetching & State:** TanStack Query (React Query) com Optimistic UI
- **PWA:** vite-plugin-pwa para instalação em iOS/Android

## Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e preencha com suas credenciais do Supabase:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Configurar Banco de Dados Supabase

Execute as migrations SQL localizadas em `supabase/migrations/` no seu projeto Supabase:

1. Acesse seu dashboard do Supabase
2. Vá em SQL Editor
3. Execute os arquivos de migração na ordem:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_add_assigned_to.sql`
   - `004_update_google_oauth_support.sql`
4. (Opcional) Execute `seed.sql` para dados de exemplo

### 3.1 Configurar Login com Google (Opcional)

Para habilitar o login com Google, siga as instruções detalhadas no arquivo [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md)

### 4. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## Estrutura do Projeto

```
my-home/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Header, BottomNav, BottomSheet
│   │   └── tasks/           # TaskCard, TaskList
│   ├── features/
│   │   ├── auth/            # Login, AuthProvider
│   │   ├── tasks/           # Hooks, mutations
│   │   ├── gamification/    # Points, History, Ranking
│   │   └── rewards/         # Prêmios
│   ├── lib/
│   │   ├── supabase.ts      # Cliente Supabase
│   │   └── utils.ts         # Helpers
│   ├── hooks/               # Custom hooks
│   ├── types/               # TypeScript types
│   └── App.tsx
├── supabase/
│   ├── migrations/          # SQL migrations
│   └── seed.sql             # Dados iniciais
└── public/
    └── icons/               # PWA icons
```

## Features

- ✅ **Autenticação** com Supabase Auth (Email/Senha, Magic Link, Google OAuth)
- ✅ **Optimistic UI** para experiência instantânea
- ✅ **Gamificação** com sistema de pontos e ranking
- ✅ **PWA** instalável em dispositivos móveis
- ✅ **Mobile-First** design com Bottom Navigation
- ✅ **Offline-capable** com service workers
- ✅ **Recorrência de Tarefas** (diária, semanal, pontual)

## Scripts

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## PWA

O app está configurado como Progressive Web App e pode ser instalado em dispositivos iOS e Android. Os ícones devem ser adicionados na pasta `public/icons/`:

- `icon-192x192.png`
- `icon-512x512.png`

## Licença

MIT
