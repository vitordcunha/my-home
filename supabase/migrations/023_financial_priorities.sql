-- =====================================================
-- MIGRATION 023: FINANCIAL PRIORITIES & SETTINGS
-- =====================================================
-- Implementa sistema de prioridades para despesas
-- e configurações financeiras personalizadas
-- =====================================================

-- =====================================================
-- 1. ADICIONAR PRIORIDADE NAS DESPESAS
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='expenses' AND column_name='priority'
  ) THEN
    ALTER TABLE expenses
    ADD COLUMN priority TEXT DEFAULT 'P3' CHECK (priority IN ('P1', 'P2', 'P3', 'P4'));
    
    COMMENT ON COLUMN expenses.priority IS 'Prioridade da despesa: P1=Essencial, P2=Importante, P3=Desejável, P4=Opcional';
  END IF;
END $$;

-- =====================================================
-- 2. TABELA DE CONFIGURAÇÕES FINANCEIRAS
-- =====================================================
CREATE TABLE IF NOT EXISTS financial_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Reserva mínima
  minimum_reserve_type TEXT DEFAULT 'percentage' CHECK (minimum_reserve_type IN ('fixed', 'percentage')),
  minimum_reserve_value DECIMAL(10, 2) DEFAULT 10.0, -- 10% ou R$ fixo
  
  -- Fator de peso para fins de semana
  weekend_weight DECIMAL(3, 2) DEFAULT 1.5,
  
  -- Default priority para novas despesas
  default_expense_priority TEXT DEFAULT 'P3' CHECK (default_expense_priority IN ('P1', 'P2', 'P3', 'P4')),
  
  -- Alertas
  enable_low_balance_alerts BOOLEAN DEFAULT true,
  alert_threshold_days INTEGER DEFAULT 7, -- alertar se saldo vai ficar negativo nos próximos X dias
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_financial_settings_household ON financial_settings(household_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_financial_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_financial_settings_updated_at ON financial_settings;
CREATE TRIGGER trigger_update_financial_settings_updated_at
  BEFORE UPDATE ON financial_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_settings_updated_at();

-- =====================================================
-- 3. FUNÇÃO: MAPEAR CATEGORIA PARA PRIORIDADE SUGERIDA
-- =====================================================
CREATE OR REPLACE FUNCTION suggest_expense_priority(p_category TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE p_category
    WHEN 'casa' THEN 'P1'        -- Aluguel, condomínio
    WHEN 'contas' THEN 'P1'      -- Luz, água, internet
    WHEN 'mercado' THEN 'P2'     -- Mercado
    WHEN 'manutencao' THEN 'P2'  -- Manutenção
    WHEN 'limpeza' THEN 'P2'     -- Produtos de limpeza
    WHEN 'delivery' THEN 'P3'    -- Delivery
    ELSE 'P3'                     -- Outros
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 4. TRIGGER: AUTO-ATRIBUIR PRIORIDADE BASEADO NA CATEGORIA
-- =====================================================
CREATE OR REPLACE FUNCTION auto_assign_expense_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- Se prioridade não foi especificada ou é a default, sugerir baseado na categoria
  IF NEW.priority = 'P3' OR NEW.priority IS NULL THEN
    NEW.priority := suggest_expense_priority(NEW.category);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_assign_expense_priority ON expenses;
CREATE TRIGGER trigger_auto_assign_expense_priority
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_expense_priority();

-- =====================================================
-- 5. FUNÇÃO: CRIAR CONFIGURAÇÕES PADRÃO PARA HOUSEHOLD
-- =====================================================
CREATE OR REPLACE FUNCTION create_default_financial_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO financial_settings (household_id)
  VALUES (NEW.id)
  ON CONFLICT (household_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar settings automaticamente quando household é criado
DROP TRIGGER IF EXISTS trigger_create_default_financial_settings ON households;
CREATE TRIGGER trigger_create_default_financial_settings
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION create_default_financial_settings();

-- =====================================================
-- 6. CRIAR SETTINGS PARA HOUSEHOLDS EXISTENTES
-- =====================================================
INSERT INTO financial_settings (household_id)
SELECT id FROM households
WHERE id NOT IN (SELECT household_id FROM financial_settings)
ON CONFLICT (household_id) DO NOTHING;

-- =====================================================
-- 7. ATUALIZAR PRIORIDADES DE DESPESAS EXISTENTES
-- =====================================================
UPDATE expenses
SET priority = suggest_expense_priority(category)
WHERE priority = 'P3' OR priority IS NULL;

-- =====================================================
-- 8. RLS POLICIES: financial_settings
-- =====================================================
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;

-- Política: Membros do household podem ver configurações
CREATE POLICY "Household members can view settings"
  ON financial_settings FOR SELECT
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

-- Política: Membros do household podem atualizar configurações
CREATE POLICY "Household members can update settings"
  ON financial_settings FOR UPDATE
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

-- =====================================================
-- 9. COMMENTS
-- =====================================================
COMMENT ON TABLE financial_settings IS 'Configurações financeiras personalizadas por household';
COMMENT ON FUNCTION suggest_expense_priority IS 'Sugere prioridade baseado na categoria da despesa';
COMMENT ON FUNCTION auto_assign_expense_priority IS 'Atribui prioridade automaticamente se não especificada';
COMMENT ON FUNCTION create_default_financial_settings IS 'Cria configurações padrão quando household é criado';
