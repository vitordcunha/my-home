-- =====================================================
-- MIGRATION 017: BUDGETS
-- =====================================================
-- Feature: Orçamentos por Categoria
-- Permite definir limites de gastos por categoria para controle financeiro
-- =====================================================

-- =====================================================
-- TABLE: budgets
-- =====================================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  
  -- Categoria do orçamento
  category TEXT NOT NULL CHECK (category IN (
    'casa',        -- aluguel, condomínio
    'contas',      -- luz, água, gás, internet
    'mercado',     -- compras de mercado
    'delivery',    -- delivery/restaurante
    'limpeza',     -- produtos de limpeza
    'manutencao',  -- manutenção/reparos
    'custom',      -- categoria customizada
    'outros'       -- outros
  )),
  
  -- Limite mensal
  limit_amount DECIMAL(10, 2) NOT NULL CHECK (limit_amount > 0),
  
  -- Período (opcional, para orçamentos específicos de um mês/ano)
  -- Se NULL, o orçamento é válido para todos os meses
  budget_month INTEGER CHECK (budget_month >= 1 AND budget_month <= 12),
  budget_year INTEGER CHECK (budget_year >= 2020),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Garantir que não há duplicatas de orçamento para mesma categoria/mês/ano/household
  -- Se budget_month e budget_year forem NULL, é um orçamento geral (válido para todos os meses)
  UNIQUE(household_id, category, budget_month, budget_year)
);

-- Índices para performance
CREATE INDEX idx_budgets_household ON budgets(household_id);
CREATE INDEX idx_budgets_category ON budgets(category);
CREATE INDEX idx_budgets_period ON budgets(budget_year, budget_month);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_budgets_updated_at();

-- =====================================================
-- FUNCTION: Get current month budget for a category
-- =====================================================
CREATE OR REPLACE FUNCTION get_budget_for_category(
  p_household_id UUID,
  p_category TEXT,
  p_month INTEGER DEFAULT NULL,
  p_year INTEGER DEFAULT NULL
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_budget DECIMAL(10, 2);
  v_month INTEGER;
  v_year INTEGER;
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
  
  -- Primeiro tentar encontrar orçamento específico do mês/ano
  SELECT limit_amount INTO v_budget
  FROM budgets
  WHERE household_id = p_household_id
    AND category = p_category
    AND budget_month = v_month
    AND budget_year = v_year
  LIMIT 1;
  
  -- Se não encontrou, buscar orçamento geral (sem mês/ano específico)
  IF v_budget IS NULL THEN
    SELECT limit_amount INTO v_budget
    FROM budgets
    WHERE household_id = p_household_id
      AND category = p_category
      AND budget_month IS NULL
      AND budget_year IS NULL
    LIMIT 1;
  END IF;
  
  -- Retornar 0 se não encontrou nenhum orçamento
  RETURN COALESCE(v_budget, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get all budgets for current month
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_month_budgets(p_household_id UUID)
RETURNS TABLE(
  category TEXT,
  limit_amount DECIMAL(10, 2),
  budget_id UUID
) AS $$
DECLARE
  v_month INTEGER;
  v_year INTEGER;
BEGIN
  v_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  v_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  
  -- Retornar orçamentos específicos do mês atual OU orçamentos gerais (sem mês/ano)
  RETURN QUERY
  SELECT DISTINCT ON (b.category)
    b.category,
    b.limit_amount,
    b.id as budget_id
  FROM budgets b
  WHERE b.household_id = p_household_id
    AND (
      (b.budget_month = v_month AND b.budget_year = v_year)
      OR (b.budget_month IS NULL AND b.budget_year IS NULL)
    )
  ORDER BY b.category, 
    CASE 
      WHEN b.budget_month IS NOT NULL THEN 0  -- Priorizar específicos
      ELSE 1
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Membros do household podem visualizar orçamentos
CREATE POLICY "Household members can view budgets"
  ON budgets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.household_id = budgets.household_id
    )
  );

-- Membros do household podem criar orçamentos
CREATE POLICY "Household members can create budgets"
  ON budgets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.household_id = budgets.household_id
    )
    AND created_by = auth.uid()
  );

-- Membros do household podem atualizar orçamentos
CREATE POLICY "Household members can update budgets"
  ON budgets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.household_id = budgets.household_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.household_id = budgets.household_id
    )
  );

-- Membros do household podem deletar orçamentos
CREATE POLICY "Household members can delete budgets"
  ON budgets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.household_id = budgets.household_id
    )
  );

-- Comentários
COMMENT ON TABLE budgets IS 'Orçamentos mensais por categoria para controle de gastos';
COMMENT ON FUNCTION get_budget_for_category IS 'Retorna o limite de orçamento para uma categoria específica no mês/ano atual ou geral';
COMMENT ON FUNCTION get_current_month_budgets IS 'Retorna todos os orçamentos válidos para o mês atual';

