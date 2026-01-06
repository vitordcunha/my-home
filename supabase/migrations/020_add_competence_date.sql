-- =====================================================
-- MIGRATION 020: ADD COMPETENCE DATE
-- =====================================================
-- Feature: Data de Competência para Planejamento Financeiro
-- Permite contabilizar receitas/despesas no mês correto do orçamento,
-- independente de quando o dinheiro efetivamente entrou/saiu
-- =====================================================

-- =====================================================
-- ALTER TABLE: incomes - Adicionar competence_date
-- =====================================================

-- Adicionar coluna competence_date
ALTER TABLE incomes
ADD COLUMN IF NOT EXISTS competence_date DATE;

-- Preencher valores retroativos
-- Para receitas já recebidas, usar a data de recebimento
UPDATE incomes
SET competence_date = DATE(received_at)
WHERE received_at IS NOT NULL AND competence_date IS NULL;

-- Para receitas projetadas, usar next_occurrence_date
UPDATE incomes
SET competence_date = DATE(next_occurrence_date)
WHERE received_at IS NULL 
  AND next_occurrence_date IS NOT NULL 
  AND competence_date IS NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_incomes_competence_date 
ON incomes(competence_date);

-- Comentário explicativo
COMMENT ON COLUMN incomes.competence_date IS 
'Data de competência para planejamento financeiro. Define a qual mês esta receita pertence no orçamento, independente de quando foi recebida (received_at)';

-- =====================================================
-- ALTER TABLE: expenses - Adicionar competence_date
-- =====================================================

-- Adicionar coluna competence_date
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS competence_date DATE;

-- Preencher valores retroativos
-- Para despesas já pagas, usar a data de pagamento
UPDATE expenses
SET competence_date = DATE(paid_at)
WHERE competence_date IS NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_expenses_competence_date 
ON expenses(competence_date);

-- Comentário explicativo
COMMENT ON COLUMN expenses.competence_date IS 
'Data de competência para planejamento financeiro. Define a qual mês esta despesa pertence no orçamento, independente de quando foi paga (paid_at)';

-- =====================================================
-- FUNCTION: Atualizar get_financial_balance com competence_date
-- =====================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS get_financial_balance(UUID, INTEGER, INTEGER);

-- Criar função atualizada
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
  v_start_date DATE;
  v_end_date DATE;
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
  v_start_date := MAKE_DATE(v_year, v_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- =====================================================
  -- 1. SALDO INICIAL (Opening Balance)
  -- =====================================================
  -- Soma todas as receitas REALIZADAS com competência ANTES deste mês
  SELECT COALESCE(SUM(amount), 0) INTO v_income_before
  FROM incomes
  WHERE household_id = p_household_id
    AND received_at IS NOT NULL  -- Apenas receitas já recebidas
    AND competence_date < v_start_date;

  -- Soma todas as despesas PAGAS com competência ANTES deste mês
  SELECT COALESCE(SUM(amount), 0) INTO v_expense_before
  FROM expenses
  WHERE household_id = p_household_id
    AND competence_date < v_start_date;

  -- Saldo inicial = receitas anteriores - despesas anteriores
  opening_balance := v_income_before - v_expense_before;

  -- =====================================================
  -- 2. RECEITAS REALIZADAS DO MÊS
  -- =====================================================
  -- Receitas já recebidas (received_at não NULL) com competência neste mês
  SELECT COALESCE(SUM(amount), 0) INTO total_income
  FROM incomes
  WHERE household_id = p_household_id
    AND received_at IS NOT NULL
    AND competence_date >= v_start_date
    AND competence_date <= v_end_date;
  
  -- =====================================================
  -- 3. DESPESAS PAGAS DO MÊS
  -- =====================================================
  -- Despesas com competência neste mês
  SELECT COALESCE(SUM(amount), 0) INTO total_expenses
  FROM expenses
  WHERE household_id = p_household_id
    AND competence_date >= v_start_date
    AND competence_date <= v_end_date;
  
  -- =====================================================
  -- 4. SALDO LÍQUIDO DO MÊS (Realizado)
  -- =====================================================
  net_balance := total_income - total_expenses;
  
  -- =====================================================
  -- 5. RECEITAS PROJETADAS
  -- =====================================================
  -- Receitas ainda não recebidas (received_at NULL) com competência neste mês
  SELECT COALESCE(SUM(amount), 0) INTO projected_income
  FROM incomes
  WHERE household_id = p_household_id
    AND received_at IS NULL
    AND competence_date >= v_start_date
    AND competence_date <= v_end_date;
  
  -- =====================================================
  -- 6. DESPESAS PROJETADAS
  -- =====================================================
  -- Despesas com due_date neste mês mas ainda não pagas
  -- OU despesas recorrentes com next_occurrence_date neste mês
  SELECT COALESCE(SUM(amount), 0) INTO projected_expenses
  FROM expenses
  WHERE household_id = p_household_id
    AND (
      -- Despesas com vencimento neste mês mas ainda não pagas
      (due_date >= v_start_date::TIMESTAMPTZ 
       AND due_date <= v_end_date::TIMESTAMPTZ 
       AND (paid_at IS NULL OR paid_at > due_date)
       AND (competence_date IS NULL OR competence_date >= v_start_date))
      -- OU despesas recorrentes
      OR (is_recurring = true 
          AND next_occurrence_date >= v_start_date::TIMESTAMPTZ 
          AND next_occurrence_date <= v_end_date::TIMESTAMPTZ 
          AND paid_at IS NULL)
    );
  
  -- =====================================================
  -- 7. SALDO PROJETADO (Opening + Realizado + Projetado)
  -- =====================================================
  projected_balance := (opening_balance + total_income + projected_income) 
                       - (total_expenses + projected_expenses);
  
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
COMMENT ON FUNCTION get_financial_balance IS 
'Calcula saldo financeiro usando data de competência. Opening balance considera tudo que aconteceu antes do mês (por competência). Receitas/despesas do mês usam competence_date.';

-- =====================================================
-- FUNCTION: Atualizar get_financial_timeline com competence_date
-- =====================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS get_financial_timeline(UUID, INTEGER, INTEGER);

-- Criar função atualizada
CREATE FUNCTION get_financial_timeline(
  p_household_id UUID,
  p_month INTEGER DEFAULT NULL,
  p_year INTEGER DEFAULT NULL
)
RETURNS TABLE(
  date TIMESTAMPTZ,
  type TEXT,
  description TEXT,
  amount DECIMAL(10, 2),
  category TEXT,
  is_projected BOOLEAN,
  item_id UUID,
  competence_date DATE,
  real_date TIMESTAMPTZ
) AS $$
DECLARE
  v_month INTEGER;
  v_year INTEGER;
  v_start_date DATE;
  v_end_date DATE;
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
  v_start_date := MAKE_DATE(v_year, v_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Unir receitas e despesas em uma timeline
  -- USAR COMPETENCE_DATE para filtrar o mês
  RETURN QUERY
  SELECT 
    COALESCE(i.received_at, i.next_occurrence_date) as date,
    'income'::TEXT as type,
    i.description,
    i.amount,
    i.category,
    (i.received_at IS NULL) as is_projected,
    i.id as item_id,
    i.competence_date,
    i.received_at as real_date
  FROM incomes i
  WHERE i.household_id = p_household_id
    AND i.competence_date >= v_start_date
    AND i.competence_date <= v_end_date
  
  UNION ALL
  
  SELECT 
    COALESCE(e.paid_at, e.due_date, e.next_occurrence_date) as date,
    'expense'::TEXT as type,
    e.description,
    -e.amount as amount,
    e.category,
    (e.paid_at IS NULL) as is_projected,
    e.id as item_id,
    e.competence_date,
    e.paid_at as real_date
  FROM expenses e
  WHERE e.household_id = p_household_id
    AND e.competence_date >= v_start_date
    AND e.competence_date <= v_end_date
  
  ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário atualizado
COMMENT ON FUNCTION get_financial_timeline IS 
'Retorna timeline financeira usando data de competência para filtrar o mês. Inclui tanto a data de competência quanto a data real para referência.';

-- =====================================================
-- TRIGGER: Auto-preencher competence_date em novos registros
-- =====================================================

-- Função para auto-preencher competence_date em incomes
CREATE OR REPLACE FUNCTION set_income_competence_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Se competence_date não foi especificada, usar received_at ou next_occurrence_date
  IF NEW.competence_date IS NULL THEN
    IF NEW.received_at IS NOT NULL THEN
      NEW.competence_date := DATE(NEW.received_at);
    ELSIF NEW.next_occurrence_date IS NOT NULL THEN
      NEW.competence_date := DATE(NEW.next_occurrence_date);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para incomes
DROP TRIGGER IF EXISTS trigger_set_income_competence_date ON incomes;
CREATE TRIGGER trigger_set_income_competence_date
  BEFORE INSERT OR UPDATE ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION set_income_competence_date();

-- Função para auto-preencher competence_date em expenses
CREATE OR REPLACE FUNCTION set_expense_competence_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Se competence_date não foi especificada, usar paid_at
  IF NEW.competence_date IS NULL THEN
    NEW.competence_date := DATE(NEW.paid_at);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para expenses
DROP TRIGGER IF EXISTS trigger_set_expense_competence_date ON expenses;
CREATE TRIGGER trigger_set_expense_competence_date
  BEFORE INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION set_expense_competence_date();

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TRIGGER trigger_set_income_competence_date ON incomes IS 
'Auto-preenche competence_date com received_at se não especificada';

COMMENT ON TRIGGER trigger_set_expense_competence_date ON expenses IS 
'Auto-preenche competence_date com paid_at se não especificada';
