-- =====================================================
-- SCRIPT DE LIMPEZA PARCIAL DO BANCO DE DADOS
-- =====================================================
-- Este script remove apenas dados transacionais
-- MANTÉM: Usuários (profiles) e households
-- REMOVE: Tarefas, despesas, compras, manutenções, etc.
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
-- LIMPAR DADOS TRANSACIONAIS
-- =====================================================

-- 1. Limpar tabelas de manutenção (dependências primeiro)
DELETE FROM maintenance_updates;
DELETE FROM maintenance_history;
DELETE FROM recurring_maintenances;
DELETE FROM technician_contacts;
DELETE FROM maintenance_items;

-- 2. Limpar tabelas de despesas
DELETE FROM expense_splits;
DELETE FROM expenses;

-- 3. Limpar tabelas de compras
DELETE FROM shopping_items;

-- 4. Limpar tabelas de gamificação
DELETE FROM tasks_history;
DELETE FROM tasks_master;
DELETE FROM rewards;

-- 5. Resetar pontos dos usuários
UPDATE profiles SET total_points = 0;

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
-- ESTATÍSTICAS FINAIS
-- =====================================================
DO $$
DECLARE
  users_count INTEGER;
  households_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_count FROM profiles;
  SELECT COUNT(*) INTO households_count FROM households;
  
  RAISE NOTICE '✅ Limpeza parcial realizada com sucesso!';
  RAISE NOTICE '👥 Usuários mantidos: %', users_count;
  RAISE NOTICE '🏠 Households mantidos: %', households_count;
  RAISE NOTICE '📊 Todos os dados transacionais foram removidos';
  RAISE NOTICE '🔄 Pontos dos usuários foram zerados';
END $$;

