# Scripts de Limpeza do Banco de Dados

Este diretório contém scripts SQL para limpar dados do banco de dados do MyHome.

## ⚠️ ATENÇÃO

Estes scripts removem dados permanentemente. Use com cuidado e sempre faça backup antes de executar em produção!

## 📁 Scripts Disponíveis

### 1. `cleanup_all_data.sql` - Limpeza Completa

**Remove TUDO:**

- ✅ Todas as tarefas e histórico
- ✅ Todas as compras
- ✅ Todas as despesas
- ✅ Todas as manutenções
- ✅ Todas as recompensas
- ✅ Todos os usuários (profiles)
- ✅ Todos os households

**Mantém:**

- ❌ Nada (exceto auth.users por padrão, mas pode ser removido)

**Quando usar:**

- Resetar completamente o banco para recomeçar
- Ambiente de desenvolvimento/testes

### 2. `cleanup_keep_users.sql` - Limpeza Parcial (Recomendado)

**Remove:**

- ✅ Todas as tarefas e histórico
- ✅ Todas as compras
- ✅ Todas as despesas
- ✅ Todas as manutenções
- ✅ Todas as recompensas

**Mantém:**

- ✅ Usuários (profiles)
- ✅ Households
- ✅ Estrutura de contas

**Ações adicionais:**

- 🔄 Reseta pontos dos usuários para 0

**Quando usar:**

- Limpar dados de teste mas manter usuários
- Resetar apenas o conteúdo transacional
- Recomeçar gamificação mantendo membros

### 3. `cleanup_specific.sql` - Limpeza Modular

**Permite limpar módulos específicos:**

- 🎯 Apenas tarefas
- 🎯 Apenas compras
- 🎯 Apenas despesas
- 🎯 Apenas manutenções
- 🎯 Apenas recompensas
- 🎯 Apenas pontos
- 🎯 Dados de um household específico

**Quando usar:**

- Limpar apenas um módulo específico
- Resetar apenas os pontos
- Limpar dados de um household específico

## 🚀 Como Usar

### No Supabase Dashboard:

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Crie uma nova query
4. Copie e cole o conteúdo do script desejado
5. **REVISE CUIDADOSAMENTE** o que será executado
6. Clique em **Run** para executar

### Via CLI (Local):

```bash
# Conectar ao banco local
psql -h localhost -p 54322 -U postgres -d postgres

# Executar script
\i supabase/cleanup_keep_users.sql
```

### Via CLI (Produção - Vercel/Supabase):

```bash
# Conectar ao banco de produção
psql "postgresql://[seu-connection-string]"

# Executar script
\i supabase/cleanup_keep_users.sql
```

## 📊 Verificar Dados Antes e Depois

Execute esta query para ver a quantidade de dados:

```sql
SELECT
  'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'households', COUNT(*) FROM households
UNION ALL
SELECT 'tasks_master', COUNT(*) FROM tasks_master
UNION ALL
SELECT 'tasks_history', COUNT(*) FROM tasks_history
UNION ALL
SELECT 'shopping_items', COUNT(*) FROM shopping_items
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'maintenance_items', COUNT(*) FROM maintenance_items
UNION ALL
SELECT 'rewards', COUNT(*) FROM rewards;
```

## 🔒 Boas Práticas

1. **Sempre faça backup antes** (especialmente em produção)
2. **Teste primeiro em desenvolvimento**
3. **Revise o script antes de executar**
4. **Documente quando e por que limpou os dados**
5. **Notifique os usuários se for em produção**

## 🛠️ Troubleshooting

### Erro: "trigger does not exist"

Alguns triggers podem não existir dependendo de qual migration está aplicada. Isto é normal, ignore o erro.

### Erro: "permission denied"

Certifique-se de estar conectado como usuário com permissões de admin (postgres).

### Erro: "foreign key constraint"

Os scripts já estão ordenados para respeitar constraints. Se ainda der erro, use `CASCADE` nas queries.

## 📝 Exemplo de Uso Comum

### Cenário: Resetar dados de teste mantendo usuários

```bash
# 1. Ver quantos dados existem
psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT COUNT(*) FROM tasks_history"

# 2. Executar limpeza parcial
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/cleanup_keep_users.sql

# 3. Verificar que limpou
psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT COUNT(*) FROM tasks_history"
# Deve retornar 0

# 4. Verificar que manteve usuários
psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT COUNT(*) FROM profiles"
# Deve retornar o número de usuários original
```

## 📌 Notas Importantes

- Os scripts desabilitam triggers temporariamente para evitar processamento desnecessário de XP durante a limpeza
- Todos os triggers são reabilitados ao final
- As tabelas usam UUIDs, então não há sequences para resetar
- Os dados em `auth.users` são mantidos por padrão (precisa descomentar linha para remover)

## 🆘 Recuperação de Dados

Se precisar recuperar dados após limpeza acidental:

1. **Backup recente**: Restaure do backup mais recente
2. **Supabase Auto-backup**: Contate o suporte Supabase para restauração
3. **Point-in-time recovery**: Se configurado no Supabase (planos pagos)

## 📞 Suporte

Se tiver dúvidas ou problemas:

1. Revise a documentação das migrations em `supabase/migrations/`
2. Verifique os logs do Supabase
3. Entre em contato com o time de desenvolvimento


