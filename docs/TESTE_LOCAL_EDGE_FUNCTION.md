# 🧪 Como Testar a Edge Function Localmente

## Método 1: Usando o Script Automático (Recomendado)

```bash
./test-edge-function.sh
```

O script vai:
1. Verificar se o Supabase está rodando
2. Criar um usuário de teste
3. Fazer login e obter um token JWT válido
4. Testar a função com dados de exemplo

## Método 2: Manual com cURL

### 1. Obter o Anon Key

```bash
supabase status
```

Copie o valor de `Publishable` (anon key).

### 2. Criar um Usuário de Teste

```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/signup' \
  -H "apikey: SEU_ANON_KEY_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### 3. Fazer Login e Obter Token

```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: SEU_ANON_KEY_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

Copie o `access_token` da resposta.

### 4. Criar um Household (se necessário)

Primeiro, você precisa criar um household no banco. Você pode fazer isso via Supabase Studio:
- Acesse: http://127.0.0.1:54323
- Vá em Table Editor > households
- Crie um novo registro
- Copie o `id` do household criado

### 5. Testar a Edge Function

```bash
curl -X POST 'http://127.0.0.1:54321/functions/v1/process-statement' \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI" \
  -H "apikey: SEU_ANON_KEY_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "statement_text": "05/01/2026 DEPOSITO SALARIO 5000.00\n10/01/2026 IFOOD *OSASCO -45.00",
    "household_id": "UUID_DO_HOUSEHOLD_AQUI",
    "month": 1,
    "year": 2026
  }'
```

## Método 3: Testar Direto no App

A forma mais fácil é testar diretamente no app:

1. Certifique-se de que o Supabase está rodando: `supabase start`
2. Certifique-se de que a Edge Function está servindo: `supabase functions serve process-statement --env-file supabase/.env.local`
3. Configure o `.env` do app para apontar para o Supabase local:
   ```
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=seu-anon-key-local
   ```
4. Abra o app e teste a funcionalidade de importação

## 🔍 Troubleshooting

### Erro: "Invalid JWT"
- Certifique-se de que está usando um token válido
- O token deve ser obtido via `/auth/v1/token`, não o anon key diretamente

### Erro: "Access denied to this household"
- Certifique-se de que o usuário pertence ao household_id informado
- Crie o household primeiro e associe o usuário a ele

### Erro: "OpenAI API key not configured"
- Verifique se o arquivo `supabase/.env.local` existe
- Certifique-se de que contém `OPENAI_API_KEY=sk-proj-...`

### A função não responde
- Verifique se está rodando: `supabase functions serve process-statement --env-file supabase/.env.local`
- Verifique os logs no terminal onde a função está rodando

## 📝 Exemplo de Resposta Esperada

```json
{
  "transactions": [
    {
      "date": "2026-01-05",
      "description": "Salário Mensal",
      "amount": 5000,
      "type": "income",
      "category": "salario",
      "confidence": 0.95,
      "match_type": "none"
    },
    {
      "date": "2026-01-10",
      "description": "iFood Osasco",
      "amount": 45,
      "type": "expense",
      "category": "delivery",
      "confidence": 0.9,
      "match_type": "none"
    }
  ],
  "summary": {
    "total_transactions": 2,
    "total_income": 5000,
    "total_expenses": 45,
    "matched_transactions": 0,
    "categories": ["salario", "delivery"]
  }
}
```



