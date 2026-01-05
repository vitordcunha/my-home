-- =====================================================
-- MIGRATION 011: EXPENSES REFACTOR
-- =====================================================
-- Refatoração para simplificar despesas:
-- - Adicionar campo para categoria customizada
-- - Adicionar campo para marcar se foi dividido
-- - Adicionar campo para quem dividiu (array de user_ids)
-- =====================================================

-- Adicionar nova coluna para categoria customizada
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS custom_category TEXT;

-- Adicionar coluna para indicar se foi dividido
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS is_split BOOLEAN DEFAULT false;

-- Adicionar coluna para indicar com quem foi dividido
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS split_with UUID[] DEFAULT '{}';

-- Atualizar categoria para aceitar 'custom'
ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_category_check;

ALTER TABLE expenses
ADD CONSTRAINT expenses_category_check CHECK (category IN (
  'casa',        -- aluguel, condomínio
  'contas',      -- luz, água, gás, internet
  'mercado',     -- compras de mercado
  'delivery',    -- delivery/restaurante
  'limpeza',     -- produtos de limpeza
  'manutencao',  -- manutenção/reparos
  'custom',      -- categoria customizada
  'outros'       -- outros
));

-- Índice para busca por mês/ano removido
-- (DATE_TRUNC não é IMMUTABLE com TIMESTAMPTZ)
-- O índice idx_expenses_paid_at existente é suficiente para queries de data

-- =====================================================
-- FUNCTION: Criar splits com novo sistema
-- =====================================================
CREATE OR REPLACE FUNCTION create_expense_splits()
RETURNS TRIGGER AS $$
DECLARE
  member UUID;
  split_amount DECIMAL(10, 2);
  member_count INTEGER;
BEGIN
  -- Limpar splits antigos se existirem
  DELETE FROM expense_splits WHERE expense_id = NEW.id;
  
  -- Se não foi marcado como dividido, não criar splits
  IF NOT NEW.is_split THEN
    RETURN NEW;
  END IF;
  
  -- Se split_with está vazio, usar divisão igual entre todos membros
  IF array_length(NEW.split_with, 1) IS NULL THEN
    -- Pegar todos os membros ativos do household (exceto quem pagou)
    member_count := (
      SELECT COUNT(*)
      FROM profiles
      WHERE household_id = NEW.household_id
        AND id != NEW.paid_by
    );
    
    -- Se não houver outros membros, não criar splits
    IF member_count = 0 THEN
      RETURN NEW;
    END IF;
    
    -- Calcular valor por pessoa (incluindo quem pagou)
    split_amount := NEW.amount / (member_count + 1);
    
    -- Criar splits para cada membro (exceto quem pagou)
    FOR member IN 
      SELECT id FROM profiles
      WHERE household_id = NEW.household_id
        AND id != NEW.paid_by
    LOOP
      INSERT INTO expense_splits (expense_id, user_id, amount_owed)
      VALUES (NEW.id, member, split_amount);
    END LOOP;
  ELSE
    -- Dividir apenas com as pessoas especificadas
    member_count := array_length(NEW.split_with, 1);
    split_amount := NEW.amount / (member_count + 1);
    
    -- Criar splits para cada membro especificado
    FOREACH member IN ARRAY NEW.split_with LOOP
      IF member != NEW.paid_by THEN
        INSERT INTO expense_splits (expense_id, user_id, amount_owed)
        VALUES (NEW.id, member, split_amount);
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Calcular total gasto por usuário
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_total_spent(p_user_id UUID, p_household_id UUID)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(amount), 0)
    FROM expenses
    WHERE household_id = p_household_id
      AND paid_by = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Calcular total gasto do household no mês
-- =====================================================
CREATE OR REPLACE FUNCTION get_household_monthly_total(p_household_id UUID, p_month DATE)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(amount), 0)
    FROM expenses
    WHERE household_id = p_household_id
      AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', p_month)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN expenses.custom_category IS 'Categoria customizada quando category = custom';
COMMENT ON COLUMN expenses.is_split IS 'Indica se a despesa foi dividida';
COMMENT ON COLUMN expenses.split_with IS 'IDs dos usuários com quem a despesa foi dividida';
COMMENT ON FUNCTION get_user_total_spent IS 'Retorna o total gasto por um usuário';
COMMENT ON FUNCTION get_household_monthly_total IS 'Retorna o total gasto pelo household em um mês';

