-- =====================================================
-- SCRIPT DE LIMPEZA ESPECÍFICA POR MÓDULO
-- =====================================================
-- Descomente apenas as seções que deseja limpar
-- =====================================================

-- =====================================================
-- OPÇÃO 1: Limpar apenas TAREFAS
-- =====================================================
/*
ALTER TABLE tasks_history DISABLE TRIGGER on_task_completed;
DELETE FROM tasks_history;
DELETE FROM tasks_master;
ALTER TABLE tasks_history ENABLE TRIGGER on_task_completed;
RAISE NOTICE '✅ Tarefas limpas';
*/

-- =====================================================
-- OPÇÃO 2: Limpar apenas COMPRAS
-- =====================================================
/*
ALTER TABLE shopping_items DISABLE TRIGGER on_shopping_item_reported;
DELETE FROM shopping_items;
ALTER TABLE shopping_items ENABLE TRIGGER on_shopping_item_reported;
RAISE NOTICE '✅ Lista de compras limpa';
*/

-- =====================================================
-- OPÇÃO 3: Limpar apenas DESPESAS
-- =====================================================
/*
ALTER TABLE expenses DISABLE TRIGGER trigger_award_expense_xp;
ALTER TABLE expense_splits DISABLE TRIGGER trigger_award_payment_confirmation_xp;
DELETE FROM expense_splits;
DELETE FROM expenses;
ALTER TABLE expenses ENABLE TRIGGER trigger_award_expense_xp;
ALTER TABLE expense_splits ENABLE TRIGGER trigger_award_payment_confirmation_xp;
RAISE NOTICE '✅ Despesas limpas';
*/

-- =====================================================
-- OPÇÃO 4: Limpar apenas MANUTENÇÃO
-- =====================================================
/*
ALTER TABLE maintenance_items DISABLE TRIGGER trigger_award_report_maintenance_xp;
ALTER TABLE maintenance_items DISABLE TRIGGER trigger_award_assign_maintenance_xp;
ALTER TABLE maintenance_items DISABLE TRIGGER trigger_award_resolve_maintenance_xp;
ALTER TABLE maintenance_history DISABLE TRIGGER trigger_award_preventive_maintenance_xp;

DELETE FROM maintenance_updates;
DELETE FROM maintenance_history;
DELETE FROM recurring_maintenances;
DELETE FROM technician_contacts;
DELETE FROM maintenance_items;

ALTER TABLE maintenance_items ENABLE TRIGGER trigger_award_report_maintenance_xp;
ALTER TABLE maintenance_items ENABLE TRIGGER trigger_award_assign_maintenance_xp;
ALTER TABLE maintenance_items ENABLE TRIGGER trigger_award_resolve_maintenance_xp;
ALTER TABLE maintenance_history ENABLE TRIGGER trigger_award_preventive_maintenance_xp;
RAISE NOTICE '✅ Manutenções limpas';
*/

-- =====================================================
-- OPÇÃO 5: Limpar apenas RECOMPENSAS
-- =====================================================
/*
ALTER TABLE rewards DISABLE TRIGGER on_reward_redeemed;
DELETE FROM rewards;
ALTER TABLE rewards ENABLE TRIGGER on_reward_redeemed;
RAISE NOTICE '✅ Recompensas limpas';
*/

-- =====================================================
-- OPÇÃO 6: Resetar apenas PONTOS dos usuários
-- =====================================================
/*
UPDATE profiles SET total_points = 0;
RAISE NOTICE '✅ Pontos resetados para todos os usuários';
*/

-- =====================================================
-- OPÇÃO 7: Limpar dados de um HOUSEHOLD específico
-- =====================================================
/*
DO $$
DECLARE
  target_household_id UUID := 'COLE-O-UUID-DO-HOUSEHOLD-AQUI';
BEGIN
  -- Desabilitar triggers
  ALTER TABLE tasks_history DISABLE TRIGGER on_task_completed;
  ALTER TABLE rewards DISABLE TRIGGER on_reward_redeemed;
  ALTER TABLE shopping_items DISABLE TRIGGER on_shopping_item_reported;
  ALTER TABLE expenses DISABLE TRIGGER trigger_award_expense_xp;
  ALTER TABLE expense_splits DISABLE TRIGGER trigger_award_payment_confirmation_xp;
  ALTER TABLE maintenance_items DISABLE TRIGGER trigger_award_report_maintenance_xp;
  ALTER TABLE maintenance_items DISABLE TRIGGER trigger_award_assign_maintenance_xp;
  ALTER TABLE maintenance_items DISABLE TRIGGER trigger_award_resolve_maintenance_xp;
  ALTER TABLE maintenance_history DISABLE TRIGGER trigger_award_preventive_maintenance_xp;
  
  -- Limpar dados do household
  DELETE FROM maintenance_updates WHERE maintenance_item_id IN (
    SELECT id FROM maintenance_items WHERE household_id = target_household_id
  );
  DELETE FROM maintenance_history WHERE household_id = target_household_id;
  DELETE FROM recurring_maintenances WHERE household_id = target_household_id;
  DELETE FROM technician_contacts WHERE household_id = target_household_id;
  DELETE FROM maintenance_items WHERE household_id = target_household_id;
  
  DELETE FROM expense_splits WHERE expense_id IN (
    SELECT id FROM expenses WHERE household_id = target_household_id
  );
  DELETE FROM expenses WHERE household_id = target_household_id;
  
  DELETE FROM shopping_items WHERE household_id = target_household_id;
  
  DELETE FROM tasks_history WHERE task_id IN (
    SELECT id FROM tasks_master WHERE household_id = target_household_id
  );
  DELETE FROM tasks_master WHERE household_id = target_household_id;
  
  DELETE FROM rewards WHERE household_id = target_household_id;
  
  -- Resetar pontos dos membros do household
  UPDATE profiles SET total_points = 0 WHERE household_id = target_household_id;
  
  -- Reabilitar triggers
  ALTER TABLE tasks_history ENABLE TRIGGER on_task_completed;
  ALTER TABLE rewards ENABLE TRIGGER on_reward_redeemed;
  ALTER TABLE shopping_items ENABLE TRIGGER on_shopping_item_reported;
  ALTER TABLE expenses ENABLE TRIGGER trigger_award_expense_xp;
  ALTER TABLE expense_splits ENABLE TRIGGER trigger_award_payment_confirmation_xp;
  ALTER TABLE maintenance_items ENABLE TRIGGER trigger_award_report_maintenance_xp;
  ALTER TABLE maintenance_items ENABLE TRIGGER trigger_award_assign_maintenance_xp;
  ALTER TABLE maintenance_items ENABLE TRIGGER trigger_award_resolve_maintenance_xp;
  ALTER TABLE maintenance_history ENABLE TRIGGER trigger_award_preventive_maintenance_xp;
  
  RAISE NOTICE '✅ Dados do household % limpos', target_household_id;
END $$;
*/

