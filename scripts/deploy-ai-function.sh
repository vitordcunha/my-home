#!/bin/bash

# Script de deploy da Edge Function de importação de extrato com IA
# Uso: ./deploy-ai-function.sh

set -e

echo "🚀 Deploy da Edge Function - Importação de Extrato com IA"
echo ""

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado!"
    echo "Instale com: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI encontrado"
echo ""

# Verificar se a chave da OpenAI está configurada
echo "🔑 Verificando configuração da OpenAI API Key..."
if supabase secrets list 2>/dev/null | grep -q "OPENAI_API_KEY"; then
    echo "✅ OPENAI_API_KEY já configurada"
else
    echo "⚠️  OPENAI_API_KEY não encontrada"
    echo ""
    read -p "Deseja configurar agora? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        read -p "Cole sua OpenAI API Key: " OPENAI_KEY
        supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"
        echo "✅ OPENAI_API_KEY configurada com sucesso"
    else
        echo "❌ Deploy cancelado. Configure a chave antes de continuar."
        exit 1
    fi
fi

echo ""
echo "📦 Fazendo deploy da função..."
supabase functions deploy process-statement

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📊 Para verificar os logs:"
echo "   supabase functions logs process-statement"
echo ""
echo "🧪 Para testar localmente:"
echo "   supabase functions serve process-statement --env-file supabase/.env.local"
echo ""
echo "✨ A funcionalidade já está disponível no app!"



