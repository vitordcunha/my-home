-- =====================================================
-- MIGRATION 009: EXPENSES AND EXPENSE SPLITS
-- =====================================================
-- Feature: Controle de Despesas Compartilhadas
-- Permite registrar despesas, dividir custos e equalizar contas
-- =====================================================

-- =====================================================
-- TABLE: expenses
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados básicos
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL CHECK (category IN (
    'casa',        -- aluguel, condomínio
    'contas',      -- luz, água, gás, internet
    'mercado',     -- compras de mercado
    'delivery',    -- delivery/restaurante
    'limpeza',     -- produtos de limpeza
    'manutencao',  -- manutenção/reparos
    'outros'       -- outros
  )),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  
  -- Divisão
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN (
    'equal',       -- dividir igualmente
    'custom',      -- valores customizados
    'percentage',  -- por porcentagem
    'individual'   -- não dividir (despesa individual)
  )),
  split_data JSONB DEFAULT '{}',  -- dados customizados de divisão se necessário
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_frequency TEXT CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_day INTEGER,  -- dia do mês/semana
  next_occurrence_date TIMESTAMPTZ,
  
  -- Integrações
  shopping_trip_id UUID,  -- se veio da lista de compras (soft reference)
  maintenance_item_id UUID,  -- se veio de manutenção (soft reference)
  
  -- Comprovante (futuro)
  receipt_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_expenses_household ON expenses(household_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_paid_at ON expenses(paid_at DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

-- Índice para recorrências
CREATE INDEX idx_expenses_recurring ON expenses(is_recurring, next_occurrence_date)
  WHERE is_recurring = true;

-- =====================================================
-- TABLE: expense_splits
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Quanto cada pessoa deve
  amount_owed DECIMAL(10, 2) NOT NULL CHECK (amount_owed >= 0),
  
  -- Status do pagamento
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',              -- pendente de pagamento
    'waiting_confirmation', -- aguardando confirmação
    'confirmed',            -- confirmado por ambas as partes
    'overdue'              -- atrasado (> 7 dias)
  )),
  paid_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que cada usuário aparece apenas uma vez por despesa
  UNIQUE(expense_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user ON expense_splits(user_id);
CREATE INDEX idx_expense_splits_status ON expense_splits(status);

-- =====================================================
-- FUNCTION: Criar splits automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION create_expense_splits()
RETURNS TRIGGER AS $$
DECLARE
  household_members UUID[];
  member UUID;
  split_amount DECIMAL(10, 2);
  member_count INTEGER;
BEGIN
  -- Apenas para despesas não-individuais
  IF NEW.split_type = 'individual' THEN
    RETURN NEW;
  END IF;
  
  -- Se for divisão igual
  IF NEW.split_type = 'equal' THEN
    -- Pegar todos os membros ativos do household (exceto quem pagou)
    SELECT ARRAY_AGG(id), COUNT(*) INTO household_members, member_count
    FROM profiles
    WHERE household_id = NEW.household_id
      AND id != NEW.paid_by;
    
    -- Se não houver outros membros, não criar splits
    IF member_count IS NULL OR member_count = 0 THEN
      RETURN NEW;
    END IF;
    
    -- Calcular valor por pessoa (incluindo quem pagou)
    split_amount := NEW.amount / (member_count + 1);
    
    -- Criar splits para cada membro (exceto quem pagou)
    FOREACH member IN ARRAY household_members LOOP
      INSERT INTO expense_splits (expense_id, user_id, amount_owed)
      VALUES (NEW.id, member, split_amount);
    END LOOP;
    
  -- Se for divisão customizada, processar split_data
  ELSIF NEW.split_type = 'custom' OR NEW.split_type = 'percentage' THEN
    -- split_data deve ser um objeto: { "user_id1": amount1, "user_id2": amount2, ... }
    INSERT INTO expense_splits (expense_id, user_id, amount_owed)
    SELECT 
      NEW.id,
      (jsonb_each.key)::UUID,
      CASE 
        WHEN NEW.split_type = 'percentage' THEN 
          NEW.amount * ((jsonb_each.value)::TEXT::DECIMAL / 100)
        ELSE 
          (jsonb_each.value)::TEXT::DECIMAL
      END
    FROM jsonb_each(NEW.split_data)
    WHERE (jsonb_each.key)::UUID != NEW.paid_by;  -- Excluir quem pagou
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar splits automaticamente
DROP TRIGGER IF EXISTS trigger_create_expense_splits ON expenses;
CREATE TRIGGER trigger_create_expense_splits
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION create_expense_splits();

-- =====================================================
-- FUNCTION: Atualizar updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_expenses_updated_at ON expenses;
CREATE TRIGGER trigger_update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

DROP TRIGGER IF EXISTS trigger_update_expense_splits_updated_at ON expense_splits;
CREATE TRIGGER trigger_update_expense_splits_updated_at
  BEFORE UPDATE ON expense_splits
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- =====================================================
-- FUNCTION: Adicionar XP ao registrar despesa
-- =====================================================
CREATE OR REPLACE FUNCTION award_expense_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- +10 XP por registrar despesa (promove transparência)
  -- +5 XP extra se anexou comprovante
  UPDATE profiles
  SET total_points = total_points + 
    CASE 
      WHEN NEW.receipt_url IS NOT NULL THEN 15
      ELSE 10
    END
  WHERE id = NEW.created_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_expense_xp ON expenses;
CREATE TRIGGER trigger_award_expense_xp
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION award_expense_xp();

-- =====================================================
-- FUNCTION: XP bônus ao confirmar pagamento
-- =====================================================
CREATE OR REPLACE FUNCTION award_payment_confirmation_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas quando status muda para 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- +5 XP para quem pagou (incentivo)
    UPDATE profiles
    SET total_points = total_points + 5
    WHERE id = (SELECT paid_by FROM expenses WHERE id = NEW.expense_id);
    
    -- +5 XP para quem confirmou (transparência)
    IF NEW.confirmed_by IS NOT NULL THEN
      UPDATE profiles
      SET total_points = total_points + 5
      WHERE id = NEW.confirmed_by;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_payment_confirmation_xp ON expense_splits;
CREATE TRIGGER trigger_award_payment_confirmation_xp
  AFTER UPDATE ON expense_splits
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed')
  EXECUTE FUNCTION award_payment_confirmation_xp();

-- =====================================================
-- FUNCTION: Calcular balanço por usuário
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id UUID, p_household_id UUID)
RETURNS TABLE (
  owed_by_user DECIMAL(10, 2),
  owed_to_user DECIMAL(10, 2),
  net_balance DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  WITH user_owes AS (
    -- Quanto o usuário deve (splits pendentes onde ele deve)
    SELECT COALESCE(SUM(amount_owed), 0) as total
    FROM expense_splits es
    JOIN expenses e ON e.id = es.expense_id
    WHERE es.user_id = p_user_id
      AND es.status IN ('pending', 'waiting_confirmation')
      AND e.household_id = p_household_id
  ),
  user_receives AS (
    -- Quanto devem ao usuário (splits pendentes de despesas que ele pagou)
    SELECT COALESCE(SUM(es.amount_owed), 0) as total
    FROM expenses e
    JOIN expense_splits es ON es.expense_id = e.id
    WHERE e.paid_by = p_user_id
      AND es.user_id != p_user_id
      AND es.status IN ('pending', 'waiting_confirmation')
      AND e.household_id = p_household_id
  )
  SELECT 
    (SELECT total FROM user_owes) as owed_by_user,
    (SELECT total FROM user_receives) as owed_to_user,
    (SELECT total FROM user_receives) - (SELECT total FROM user_owes) as net_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Marcar splits atrasados
-- =====================================================
CREATE OR REPLACE FUNCTION mark_overdue_expense_splits()
RETURNS void AS $$
BEGIN
  UPDATE expense_splits
  SET status = 'overdue'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES: expenses
-- =====================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Política: Membros do household podem ver todas as despesas
CREATE POLICY "Household members can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

-- Política: Membros do household podem criar despesas
CREATE POLICY "Household members can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
    AND created_by = auth.uid()
  );

-- Política: Apenas quem criou pode atualizar
CREATE POLICY "Expense creator can update"
  ON expenses FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Política: Apenas quem criou pode deletar
CREATE POLICY "Expense creator can delete"
  ON expenses FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- =====================================================
-- RLS POLICIES: expense_splits
-- =====================================================

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Política: Membros do household podem ver todos os splits
CREATE POLICY "Household members can view splits"
  ON expense_splits FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM expenses
      WHERE household_id IN (
        SELECT household_id FROM profiles
        WHERE id = auth.uid() AND household_id IS NOT NULL
      )
    )
  );

-- Política: Sistema cria splits automaticamente
CREATE POLICY "System can create splits"
  ON expense_splits FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Usuário envolvido pode atualizar status do seu split
CREATE POLICY "User can update their split status"
  ON expense_splits FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    expense_id IN (
      SELECT id FROM expenses WHERE paid_by = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    expense_id IN (
      SELECT id FROM expenses WHERE paid_by = auth.uid()
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE expenses IS 'Despesas compartilhadas da casa com sistema de divisão';
COMMENT ON TABLE expense_splits IS 'Divisão de despesas entre membros do household';
COMMENT ON FUNCTION get_user_balance IS 'Calcula saldo líquido de um usuário (quanto deve - quanto recebe)';
COMMENT ON FUNCTION create_expense_splits IS 'Cria splits automaticamente quando uma despesa é adicionada';
COMMENT ON FUNCTION award_expense_xp IS 'Dá +10 XP ao registrar despesa (transparência)';
COMMENT ON FUNCTION award_payment_confirmation_xp IS 'Dá +5 XP ao confirmar pagamento (incentivo)';
COMMENT ON FUNCTION mark_overdue_expense_splits IS 'Marca splits pendentes há mais de 7 dias como atrasados';

