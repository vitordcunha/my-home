#!/bin/bash

# Script para testar a Edge Function localmente
# Uso: ./test-edge-function.sh

# Não parar em erros esperados
set +e

echo "🧪 Testando Edge Function process-statement localmente"
echo ""

# Verificar se o Supabase está rodando
if ! supabase status > /dev/null 2>&1; then
    echo "❌ Supabase não está rodando!"
    echo "Execute: supabase start"
    exit 1
fi

# Obter o anon key do Supabase local
echo "🔑 Obtendo anon key..."
ANON_KEY=$(supabase status 2>/dev/null | grep "Publishable" | awk '{print $3}' || echo "")

if [ -z "$ANON_KEY" ]; then
    echo "⚠️  Não foi possível obter o anon key automaticamente"
    echo "Por favor, execute: supabase status"
    echo "E copie o valor de 'Publishable'"
    read -p "Cole o anon key aqui: " ANON_KEY
fi

# Criar um usuário de teste com email único
echo "📝 Criando usuário de teste..."
TIMESTAMP=$(date +%s)
EMAIL="test${TIMESTAMP}@example.com"
PASSWORD="test123456"

# Criar usuário via API
echo "   Email: $EMAIL"
SIGNUP_RESPONSE=$(curl -s -X POST 'http://127.0.0.1:54321/auth/v1/signup' \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

# Verificar se houve erro
if echo "$SIGNUP_RESPONSE" | grep -q '"error"'; then
    ERROR_MSG=$(echo "$SIGNUP_RESPONSE" | grep -o '"msg":"[^"]*' | cut -d'"' -f4)
    if echo "$ERROR_MSG" | grep -q "already registered"; then
        echo "ℹ️  Usuário já existe, tentando fazer login..."
        # Tentar com email sem timestamp
        EMAIL="test@example.com"
        SIGNUP_RESPONSE=$(curl -s -X POST 'http://127.0.0.1:54321/auth/v1/signup' \
          -H "apikey: $ANON_KEY" \
          -H "Content-Type: application/json" \
          -d "{
            \"email\": \"$EMAIL\",
            \"password\": \"$PASSWORD\"
          }" || echo "")
    else
        echo "⚠️  Erro ao criar usuário: $ERROR_MSG"
        echo "   Tentando fazer login mesmo assim..."
    fi
else
    echo "✅ Usuário criado com sucesso!"
fi

# Fazer login e obter o token
echo "🔐 Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Erro ao fazer login"
    echo "Resposta: $LOGIN_RESPONSE"
    echo ""
    echo "💡 Dica: Tente criar um usuário manualmente via Supabase Studio:"
    echo "   http://127.0.0.1:54323"
    echo "   Ou use um usuário existente do seu app"
    exit 1
fi

echo "✅ Token obtido com sucesso!"
echo ""

# Obter ou criar household_id
echo "🏠 Obtendo household_id..."
# Tentar obter o household_id do usuário
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"user":{"id":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -n "$USER_ID" ]; then
    # Aguardar um pouco para o perfil ser criado
    sleep 1
    
    # Tentar obter household_id do perfil do usuário
    HOUSEHOLD_RESPONSE=$(curl -s -X GET "http://127.0.0.1:54321/rest/v1/profiles?id=eq.$USER_ID&select=household_id" \
      -H "apikey: $ANON_KEY" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json")
    
    HOUSEHOLD_ID=$(echo "$HOUSEHOLD_RESPONSE" | grep -o '"household_id":"[^"]*' | cut -d'"' -f4 || echo "")
    
    if [ -z "$HOUSEHOLD_ID" ] || [ "$HOUSEHOLD_ID" = "null" ]; then
        echo "⚠️  Usuário não tem household. Criando um..."
        # Criar household via função SQL
        CREATE_HOUSEHOLD_RESPONSE=$(curl -s -X POST 'http://127.0.0.1:54321/rest/v1/rpc/create_household_for_user' \
          -H "apikey: $ANON_KEY" \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{
            \"p_user_id\": \"$USER_ID\",
            \"p_household_name\": \"Test Household\"
          }")
        
        HOUSEHOLD_ID=$(echo "$CREATE_HOUSEHOLD_RESPONSE" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1 || echo "")
        
        if [ -z "$HOUSEHOLD_ID" ]; then
            # Tentar obter novamente do perfil
            sleep 1
            HOUSEHOLD_RESPONSE=$(curl -s -X GET "http://127.0.0.1:54321/rest/v1/profiles?id=eq.$USER_ID&select=household_id" \
              -H "apikey: $ANON_KEY" \
              -H "Authorization: Bearer $ACCESS_TOKEN" \
              -H "Content-Type: application/json")
            HOUSEHOLD_ID=$(echo "$HOUSEHOLD_RESPONSE" | grep -o '"household_id":"[^"]*' | cut -d'"' -f4 || echo "")
        fi
    fi
fi

if [ -z "$HOUSEHOLD_ID" ] || [ "$HOUSEHOLD_ID" = "null" ]; then
    echo "⚠️  Não foi possível obter household_id automaticamente"
    echo ""
    echo "Por favor, crie um household manualmente:"
    echo "1. Acesse: http://127.0.0.1:54323"
    echo "2. Vá em Table Editor > households"
    echo "3. Crie um novo registro"
    echo "4. Copie o 'id' do household criado"
    echo ""
    read -p "Cole o household_id aqui: " HOUSEHOLD_ID
fi

if [ -z "$HOUSEHOLD_ID" ]; then
    echo "❌ É necessário um household_id para testar a função"
    exit 1
fi

echo "✅ Usando household_id: $HOUSEHOLD_ID"

# Testar a função
echo "🚀 Testando process-statement..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  'http://127.0.0.1:54321/functions/v1/process-statement' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "statement_text": "05/01/2026 DEPOSITO SALARIO 5000.00\n10/01/2026 IFOOD *OSASCO -45.00\n15/01/2026 CONTA LUZ -150.00",
    "household_id": "'"$HOUSEHOLD_ID"'",
    "month": 1,
    "year": 2026
  }')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:.*//')

echo "📊 Resposta:"
echo "Status HTTP: $HTTP_STATUS"
echo ""
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

if [ "$HTTP_STATUS" = "200" ]; then
    echo ""
    echo "✅ Sucesso! A função está funcionando corretamente."
else
    echo ""
    echo "❌ Erro! Verifique a resposta acima."
fi

