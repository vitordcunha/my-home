-- =====================================================
-- MIGRATION 022: DEBT MANAGEMENT
-- =====================================================
-- Feature: Gestão Inteligente de Dívidas e Faturas
-- Permite cadastrar configurações de dívidas (juros, vencimento) e vincular a despesas.
-- =====================================================

-- =====================================================
-- TABLE: debts
-- =====================================================
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação
  name TEXT NOT NULL, -- Ex: "Nubank", "Itaú", "Empréstimo Pessoal"
  
  -- Configurações Financeiras
  interest_rate DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Taxa de juros mensal (%)
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31), -- Dia de vencimento padrão
  
  -- Regras de Pagamento Mínimo (Opcional)
  minimum_payment_percentage DECIMAL(5, 2), -- Ex: 15%
  minimum_payment_fixed DECIMAL(10, 2),     -- Ex: R$ 50,00
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Índices
CREATE INDEX idx_debts_household ON debts(household_id);
CREATE INDEX idx_debts_active ON debts(is_active);

-- =====================================================
-- ALTER TABLE: expenses
-- =====================================================
-- Adicionar vínculo com dívida
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS debt_id UUID REFERENCES debts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_debt_id ON expenses(debt_id);

-- =====================================================
-- RLS POLICIES: debts
-- =====================================================
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Política: Membros do household podem ver dívidas
CREATE POLICY "Household members can view debts"
  ON debts FOR SELECT
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

-- Política: Membros do household podem criar dívidas
CREATE POLICY "Household members can create debts"
  ON debts FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
    AND created_by = auth.uid()
  );

-- Política: Membros do household podem atualizar dívidas
CREATE POLICY "Household members can update debts"
  ON debts FOR UPDATE
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

-- Política: Membros do household podem deletar (soft delete preferido, mas hard allowed por enquanto)
CREATE POLICY "Household members can delete debts"
  ON debts FOR DELETE
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================
-- Trigger para atualizar updated_at
CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at(); -- Reusando a função existente

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE debts IS 'Configurações de dívidas recorrentes ou parceladas (ex: Cartões de Crédito)';
COMMENT ON COLUMN expenses.debt_id IS 'Link para a dívida/cartão a qual esta despesa pertence';
