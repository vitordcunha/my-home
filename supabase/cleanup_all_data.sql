-- =====================================================
-- SCRIPT DE LIMPEZA COMPLETA DO BANCO DE DADOS
-- =====================================================
-- ATENÇÃO: Este script remove TODOS os dados do banco
-- incluindo usuários, households e todo o histórico
-- Use com EXTREMO CUIDADO!
-- =====================================================

-- Desabilitar triggers temporariamente para evitar processamento de XP
ALTER TABLE tasks_history DISABLE TRIGGER on_task_completed;
ALTER TABLE rewards DISABLE TRIGGER on_reward_redeemed;
ALTER TABLE shopping_items DISABLE TRIGGER on_shopping_item_reported;
ALTER TABLE expenses DISABLE TRIGGER trigger_award_expense_xp;
ALTER TABLE expense_splits DISABLE TRIGGER trigger_award_payment_confirmation_xp;
ALTER TABLE maintenance_items DISABLE TRIGGER trigger_award_report_maintenance_xp;
ALTER TABLE maintenance_items DISABLE TRIGGER trigger_award_assign_maintenance_xp;
ALTER TABLE maintenance_items DISABLE TRIGGER trigger_award_resolve_maintenance_xp;
ALTER TABLE maintenance_history DISABLE TRIGGER trigger_award_preventive_maintenance_xp;

-- =====================================================
-- LIMPAR DADOS TRANSACIONAIS (mantém estrutura)
-- =====================================================

-- 1. Limpar tabelas de manutenção (dependências primeiro)
TRUNCATE TABLE maintenance_updates CASCADE;
TRUNCATE TABLE maintenance_history CASCADE;
TRUNCATE TABLE recurring_maintenances CASCADE;
TRUNCATE TABLE technician_contacts CASCADE;
TRUNCATE TABLE maintenance_items CASCADE;

-- 2. Limpar tabelas de despesas
TRUNCATE TABLE expense_splits CASCADE;
TRUNCATE TABLE expenses CASCADE;

-- 3. Limpar tabelas de compras
TRUNCATE TABLE shopping_items CASCADE;

-- 4. Limpar tabelas de gamificação
TRUNCATE TABLE tasks_history CASCADE;
TRUNCATE TABLE tasks_master CASCADE;
TRUNCATE TABLE rewards CASCADE;

-- 5. Limpar perfis e households
-- ATENÇÃO: Isto também remove os usuários do sistema
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE households CASCADE;

-- 6. Limpar usuários do auth (CUIDADO!)
-- Descomente a linha abaixo APENAS se quiser remover os usuários do auth também
-- DELETE FROM auth.users;

-- =====================================================
-- RESETAR SEQUENCES (se necessário)
-- =====================================================
-- UUIDs não usam sequences, então não é necessário

-- =====================================================
-- REABILITAR TRIGGERS
-- =====================================================
ALTER TABLE tasks_history ENABLE TRIGGER on_task_completed;
ALTER TABLE rewards ENABLE TRIGGER on_reward_redeemed;
ALTER TABLE shopping_items ENABLE TRIGGER on_shopping_item_reported;
ALTER TABLE expenses ENABLE TRIGGER trigger_award_expense_xp;
ALTER TABLE expense_splits ENABLE TRIGGER trigger_award_payment_confirmation_xp;
ALTER TABLE maintenance_items ENABLE TRIGGER trigger_award_report_maintenance_xp;
ALTER TABLE maintenance_items ENABLE TRIGGER trigger_award_assign_maintenance_xp;
ALTER TABLE maintenance_items ENABLE TRIGGER trigger_award_resolve_maintenance_xp;
ALTER TABLE maintenance_history ENABLE TRIGGER trigger_award_preventive_maintenance_xp;

-- =====================================================
-- CONFIRMAÇÃO
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Limpeza completa realizada com sucesso!';
  RAISE NOTICE '📊 Todas as tabelas foram esvaziadas.';
  RAISE NOTICE '⚠️  Os usuários foram removidos do profiles, mas ainda existem em auth.users';
  RAISE NOTICE '💡 Para remover completamente os usuários, descomente a linha de DELETE em auth.users';
END $$;

