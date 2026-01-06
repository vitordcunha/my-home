-- =====================================================
-- MIGRATION 019: ADD OPENING BALANCE TO FINANCIAL ANALYSIS
-- =====================================================
-- Feature: Adiciona saldo inicial (opening balance) para análise financeira corrente
-- Permite que a análise financeira considere o saldo acumulado de meses anteriores
-- =====================================================

-- Remover função antiga antes de recriar com novo tipo de retorno
DROP FUNCTION IF EXISTS get_financial_balance(UUID, INTEGER, INTEGER);

-- Criar função get_financial_balance com opening_balance
CREATE FUNCTION get_financial_balance(
  p_household_id UUID,
  p_month INTEGER DEFAULT NULL,
  p_year INTEGER DEFAULT NULL
)
RETURNS TABLE(
  opening_balance DECIMAL(10, 2),
  total_income DECIMAL(10, 2),
  total_expenses DECIMAL(10, 2),
  net_balance DECIMAL(10, 2),
  projected_income DECIMAL(10, 2),
  projected_expenses DECIMAL(10, 2),
  projected_balance DECIMAL(10, 2)
) AS $$
DECLARE
  v_month INTEGER;
  v_year INTEGER;
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
  v_income_before DECIMAL(10, 2);
  v_expense_before DECIMAL(10, 2);
BEGIN
  -- Se não especificado, usar mês/ano atual
  IF p_month IS NULL THEN
    v_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  ELSE
    v_month := p_month;
  END IF;
  
  IF p_year IS NULL THEN
    v_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  ELSE
    v_year := p_year;
  END IF;
  
  -- Calcular início e fim do mês
  v_start_date := DATE_TRUNC('month', MAKE_DATE(v_year, v_month, 1));
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::TIMESTAMPTZ;
  
  -- 1. Calcular Saldo Inicial (Tudo antes do dia 1 deste mês)
  -- Receitas recebidas antes do início do mês
  SELECT COALESCE(SUM(amount), 0) INTO v_income_before
  FROM incomes
  WHERE household_id = p_household_id
    AND received_at IS NOT NULL
    AND received_at < v_start_date;

  -- Despesas pagas antes do início do mês
  SELECT COALESCE(SUM(amount), 0) INTO v_expense_before
  FROM expenses
  WHERE household_id = p_household_id
    AND paid_at < v_start_date;

  -- Saldo inicial = receitas anteriores - despesas anteriores
  opening_balance := v_income_before - v_expense_before;

  -- 2. Receitas realizadas no mês (received_at não NULL e dentro do período)
  SELECT COALESCE(SUM(amount), 0) INTO total_income
  FROM incomes
  WHERE household_id = p_household_id
    AND received_at IS NOT NULL
    AND received_at >= v_start_date
    AND received_at <= v_end_date;
  
  -- 3. Despesas pagas no mês (paid_at dentro do período)
  SELECT COALESCE(SUM(amount), 0) INTO total_expenses
  FROM expenses
  WHERE household_id = p_household_id
    AND paid_at >= v_start_date
    AND paid_at <= v_end_date;
  
  -- 4. Saldo líquido do mês
  net_balance := total_income - total_expenses;
  
  -- 5. Receitas projetadas (received_at NULL mas next_occurrence_date no período OU receitas recorrentes)
  SELECT COALESCE(SUM(amount), 0) INTO projected_income
  FROM incomes
  WHERE household_id = p_household_id
    AND (
      (received_at IS NULL AND next_occurrence_date >= v_start_date AND next_occurrence_date <= v_end_date)
      OR (is_recurring = true AND next_occurrence_date >= v_start_date AND next_occurrence_date <= v_end_date)
    );
  
  -- 6. Despesas projetadas (due_date no período mas ainda não pagas OU despesas recorrentes)
  SELECT COALESCE(SUM(amount), 0) INTO projected_expenses
  FROM expenses
  WHERE household_id = p_household_id
    AND (
      (due_date >= v_start_date AND due_date <= v_end_date AND (paid_at IS NULL OR paid_at > due_date))
      OR (is_recurring = true AND next_occurrence_date >= v_start_date AND next_occurrence_date <= v_end_date AND paid_at IS NULL)
    );
  
  -- 7. Saldo projetado (saldo inicial + realizado + projetado)
  projected_balance := (opening_balance + total_income + projected_income) - (total_expenses + projected_expenses);
  
  RETURN QUERY SELECT 
    opening_balance,
    total_income,
    total_expenses,
    net_balance,
    projected_income,
    projected_expenses,
    projected_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário atualizado
COMMENT ON FUNCTION get_financial_balance IS 'Calcula saldo financeiro com saldo inicial acumulado, realizado e projetado para um mês específico';

