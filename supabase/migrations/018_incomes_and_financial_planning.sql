-- =====================================================
-- MIGRATION 018: INCOMES AND FINANCIAL PLANNING
-- =====================================================
-- Feature: Sistema de Receitas e Planejamento Financeiro
-- Permite registrar receitas, gastos futuros e calcular balanceamento financeiro
-- =====================================================

-- =====================================================
-- TABLE: incomes
-- =====================================================
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados básicos
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (category IN (
    'salario',      -- salário fixo
    'freelance',    -- trabalhos freelancer
    'investimento', -- rendimentos de investimentos
    'presente',     -- presentes, mesadas
    'outros'        -- outros tipos de receita
  )),
  
  -- Quando o dinheiro entrou (ou vai entrar)
  received_at TIMESTAMPTZ, -- Se NULL, é uma receita prevista (futura)
  received_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  
  -- Recorrência (igual às despesas)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency TEXT CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_day INTEGER, -- Dia do mês que cai o salário
  next_occurrence_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_incomes_household ON incomes(household_id);
CREATE INDEX idx_incomes_received_by ON incomes(received_by);
CREATE INDEX idx_incomes_received_at ON incomes(received_at DESC);
CREATE INDEX idx_incomes_category ON incomes(category);
CREATE INDEX idx_incomes_created_at ON incomes(created_at DESC);

-- Índice para recorrências
CREATE INDEX idx_incomes_recurring ON incomes(is_recurring, next_occurrence_date)
  WHERE is_recurring = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_incomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION update_incomes_updated_at();

-- =====================================================
-- ALTER TABLE: expenses - Adicionar due_date para gastos futuros
-- =====================================================
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Índice para due_date
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date);

-- Comentário explicativo
COMMENT ON COLUMN expenses.due_date IS 'Data de vencimento da despesa. Se diferente de paid_at, indica gasto futuro ou pendente';

-- =====================================================
-- FUNCTION: Calcular Saldo Financeiro do Mês
-- =====================================================
CREATE OR REPLACE FUNCTION get_financial_balance(
  p_household_id UUID,
  p_month INTEGER DEFAULT NULL,
  p_year INTEGER DEFAULT NULL
)
RETURNS TABLE(
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
  
  -- Receitas realizadas (received_at não NULL e dentro do período)
  SELECT COALESCE(SUM(amount), 0) INTO total_income
  FROM incomes
  WHERE household_id = p_household_id
    AND received_at IS NOT NULL
    AND received_at >= v_start_date
    AND received_at <= v_end_date;
  
  -- Despesas pagas (paid_at dentro do período)
  SELECT COALESCE(SUM(amount), 0) INTO total_expenses
  FROM expenses
  WHERE household_id = p_household_id
    AND paid_at >= v_start_date
    AND paid_at <= v_end_date;
  
  -- Saldo líquido realizado
  net_balance := total_income - total_expenses;
  
  -- Receitas projetadas (received_at NULL mas next_occurrence_date no período OU receitas recorrentes)
  SELECT COALESCE(SUM(amount), 0) INTO projected_income
  FROM incomes
  WHERE household_id = p_household_id
    AND (
      (received_at IS NULL AND next_occurrence_date >= v_start_date AND next_occurrence_date <= v_end_date)
      OR (is_recurring = true AND next_occurrence_date >= v_start_date AND next_occurrence_date <= v_end_date)
    );
  
  -- Despesas projetadas (due_date no período mas ainda não pagas OU despesas recorrentes)
  SELECT COALESCE(SUM(amount), 0) INTO projected_expenses
  FROM expenses
  WHERE household_id = p_household_id
    AND (
      (due_date >= v_start_date AND due_date <= v_end_date AND (paid_at IS NULL OR paid_at > due_date))
      OR (is_recurring = true AND next_occurrence_date >= v_start_date AND next_occurrence_date <= v_end_date AND paid_at IS NULL)
    );
  
  -- Saldo projetado (realizado + projetado)
  projected_balance := (total_income + projected_income) - (total_expenses + projected_expenses);
  
  RETURN QUERY SELECT 
    total_income,
    total_expenses,
    net_balance,
    projected_income,
    projected_expenses,
    projected_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Obter Timeline Financeira do Mês
-- =====================================================
CREATE OR REPLACE FUNCTION get_financial_timeline(
  p_household_id UUID,
  p_month INTEGER DEFAULT NULL,
  p_year INTEGER DEFAULT NULL
)
RETURNS TABLE(
  date TIMESTAMPTZ,
  type TEXT, -- 'income' ou 'expense'
  description TEXT,
  amount DECIMAL(10, 2),
  category TEXT,
  is_projected BOOLEAN,
  item_id UUID
) AS $$
DECLARE
  v_month INTEGER;
  v_year INTEGER;
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
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
  
  -- Unir receitas e despesas em uma timeline
  RETURN QUERY
  SELECT 
    COALESCE(i.received_at, i.next_occurrence_date) as date,
    'income'::TEXT as type,
    i.description,
    i.amount,
    i.category,
    (i.received_at IS NULL) as is_projected,
    i.id as item_id
  FROM incomes i
  WHERE i.household_id = p_household_id
    AND (
      (i.received_at >= v_start_date AND i.received_at <= v_end_date)
      OR (i.received_at IS NULL AND i.next_occurrence_date >= v_start_date AND i.next_occurrence_date <= v_end_date)
    )
  
  UNION ALL
  
  SELECT 
    COALESCE(e.paid_at, e.due_date, e.next_occurrence_date) as date,
    'expense'::TEXT as type,
    e.description,
    -e.amount as amount, -- Negativo para despesas
    e.category,
    (e.paid_at IS NULL) as is_projected,
    e.id as item_id
  FROM expenses e
  WHERE e.household_id = p_household_id
    AND (
      (e.paid_at >= v_start_date AND e.paid_at <= v_end_date)
      OR (e.due_date >= v_start_date AND e.due_date <= v_end_date)
      OR (e.is_recurring = true AND e.next_occurrence_date >= v_start_date AND e.next_occurrence_date <= v_end_date)
    )
  
  ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Membros do household podem visualizar receitas
CREATE POLICY "Household members can view incomes"
  ON incomes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.household_id = incomes.household_id
    )
  );

-- Membros do household podem criar receitas
CREATE POLICY "Household members can create incomes"
  ON incomes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.household_id = incomes.household_id
    )
    AND created_by = auth.uid()
  );

-- Membros do household podem atualizar receitas
CREATE POLICY "Household members can update incomes"
  ON incomes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.household_id = incomes.household_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.household_id = incomes.household_id
    )
  );

-- Membros do household podem deletar receitas
CREATE POLICY "Household members can delete incomes"
  ON incomes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.household_id = incomes.household_id
    )
  );

-- Comentários
COMMENT ON TABLE incomes IS 'Receitas do household para planejamento financeiro';
COMMENT ON FUNCTION get_financial_balance IS 'Calcula saldo financeiro realizado e projetado para um mês específico';
COMMENT ON FUNCTION get_financial_timeline IS 'Retorna timeline unificada de receitas e despesas do mês';

