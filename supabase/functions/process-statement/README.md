# Process Statement Edge Function

Esta função processa extratos bancários usando IA (OpenAI GPT-4) para extrair e categorizar transações automaticamente.

## Configuração

### 1. Deploy da Função

```bash
# Fazer login no Supabase
supabase login

# Link com seu projeto
supabase link --project-ref seu-projeto-ref

# Configurar a chave da OpenAI como secret
supabase secrets set OPENAI_API_KEY=sk-...

# Deploy da função
supabase functions deploy process-statement
```

### 2. Variáveis de Ambiente Necessárias

- `OPENAI_API_KEY`: Sua chave de API da OpenAI (obter em https://platform.openai.com/api-keys)
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: Automaticamente disponibilizadas pelo Supabase

### 3. Teste Local

```bash
# Servir a função localmente
supabase functions serve process-statement --env-file supabase/.env.local

# Testar com curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-statement' \
  --header 'Authorization: Bearer eyJhbGc...' \
  --header 'Content-Type: application/json' \
  --data '{"statement_text":"05/01/2026 DEPOSITO SALARIO 5000.00\n10/01/2026 IFOOD *OSASCO -45.00","household_id":"123","month":1,"year":2026}'
```

## Formato de Entrada

```json
{
  "statement_text": "Texto do extrato bancário",
  "household_id": "uuid-da-casa",
  "month": 1,
  "year": 2026,
  "existing_incomes": [
    {
      "id": "income-id",
      "description": "Salário",
      "amount": 5000,
      "received_at": "2026-01-05"
    }
  ],
  "existing_expenses": [
    {
      "id": "expense-id",
      "description": "iFood",
      "amount": 45,
      "paid_at": "2026-01-10"
    }
  ]
}
```

## Formato de Saída

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
      "match_type": "exact",
      "matched_id": "income-id"
    }
  ],
  "summary": {
    "total_transactions": 2,
    "total_income": 5000,
    "total_expenses": 45,
    "matched_transactions": 1,
    "categories": ["salario", "delivery"]
  }
}
```

## Custo Estimado

- Modelo usado: `gpt-4o-mini`
- Custo por requisição: ~$0.001-0.01 (dependendo do tamanho do extrato)
- Alternativa gratuita: Usar Claude 3.5 Sonnet via Anthropic (até 200 req/dia grátis no tier gratuito)
