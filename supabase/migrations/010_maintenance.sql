-- =====================================================
-- MIGRATION 010: MAINTENANCE AND REPAIRS
-- =====================================================
-- Feature: Manutenção e Reparos da Casa
-- Sistema completo de gerenciamento de manutenções preventivas e corretivas
-- =====================================================

-- =====================================================
-- TABLE: maintenance_items
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados básicos
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL CHECK (location IN (
    'cozinha', 'sala', 'quarto1', 'quarto2', 'quarto3',
    'banheiro', 'lavanderia', 'area_externa', 'garagem',
    'entrada', 'deposito', 'outro'
  )),
  
  -- Classificação
  priority TEXT NOT NULL CHECK (priority IN (
    'urgent',     -- vazamento, sem energia, segurança
    'important',  -- porta emperrada, luz queimada
    'whenever'    -- estética, melhorias, conforto
  )),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'call_technician',  -- chamar técnico
    'diy',              -- fazer DIY
    'waiting_parts',    -- aguardando peças
    'contact'           -- entrar em contato (síndico, etc)
  )),
  technician_specialty TEXT,  -- eletricista, encanador, etc
  
  -- Workflow
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open',        -- aberto
    'in_progress', -- em andamento
    'waiting',     -- aguardando algo
    'resolved',    -- resolvido
    'archived'     -- arquivado
  )),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  
  -- Custos
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  time_spent_minutes INTEGER,
  
  -- Integração com despesas
  expense_id UUID,  -- soft reference to expenses.id
  
  -- Mídia
  photos TEXT[],  -- URLs das fotos
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_maintenance_household ON maintenance_items(household_id);
CREATE INDEX idx_maintenance_status ON maintenance_items(status);
CREATE INDEX idx_maintenance_priority ON maintenance_items(priority);
CREATE INDEX idx_maintenance_assigned ON maintenance_items(assigned_to);
CREATE INDEX idx_maintenance_created_at ON maintenance_items(created_at DESC);

-- =====================================================
-- TABLE: maintenance_history
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  
  -- Referência ao item (se for manutenção de item específico)
  maintenance_item_id UUID REFERENCES maintenance_items(id) ON DELETE SET NULL,
  -- Referência a manutenção recorrente
  recurring_maintenance_id UUID,  -- soft reference
  
  -- Dados
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  
  -- Detalhes
  description TEXT,
  cost DECIMAL(10, 2),
  time_spent_minutes INTEGER,
  photos TEXT[],
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_maintenance_history_household ON maintenance_history(household_id);
CREATE INDEX idx_maintenance_history_date ON maintenance_history(performed_at DESC);
CREATE INDEX idx_maintenance_history_item ON maintenance_history(maintenance_item_id);
CREATE INDEX idx_maintenance_history_recurring ON maintenance_history(recurring_maintenance_id);

-- =====================================================
-- TABLE: recurring_maintenances
-- =====================================================
CREATE TABLE IF NOT EXISTS recurring_maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  
  -- Recorrência
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('days', 'weeks', 'months', 'years')),
  frequency_value INTEGER NOT NULL CHECK (frequency_value > 0),
  
  -- Notificações
  notification_days_before INTEGER DEFAULT 3,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Instruções
  instructions TEXT,
  helpful_links TEXT[],
  
  -- Próxima ocorrência
  last_performed_at TIMESTAMPTZ,
  next_due_date TIMESTAMPTZ NOT NULL,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_recurring_maintenances_household ON recurring_maintenances(household_id);
CREATE INDEX idx_recurring_maintenances_next_due ON recurring_maintenances(next_due_date);
CREATE INDEX idx_recurring_maintenances_active ON recurring_maintenances(is_active) 
  WHERE is_active = true;

-- =====================================================
-- TABLE: maintenance_updates
-- =====================================================
CREATE TABLE IF NOT EXISTS maintenance_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_item_id UUID REFERENCES maintenance_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  
  -- Conteúdo
  content TEXT NOT NULL,
  
  -- Tipo de atualização
  update_type TEXT DEFAULT 'comment' CHECK (update_type IN (
    'comment',        -- comentário
    'status_change',  -- mudança de status
    'assignment',     -- atribuição
    'completion'      -- conclusão
  )),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_maintenance_updates_item ON maintenance_updates(maintenance_item_id);
CREATE INDEX idx_maintenance_updates_created ON maintenance_updates(created_at DESC);

-- =====================================================
-- TABLE: technician_contacts
-- =====================================================
CREATE TABLE IF NOT EXISTS technician_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  
  -- Avaliação
  rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  
  -- Histórico
  last_called_at TIMESTAMPTZ,
  times_called INTEGER DEFAULT 0,
  average_cost DECIMAL(10, 2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_technician_contacts_household ON technician_contacts(household_id);
CREATE INDEX idx_technician_contacts_specialty ON technician_contacts(specialty);

-- =====================================================
-- FUNCTION: Atualizar updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_maintenance_items_updated_at ON maintenance_items;
CREATE TRIGGER trigger_update_maintenance_items_updated_at
  BEFORE UPDATE ON maintenance_items
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_updated_at();

DROP TRIGGER IF EXISTS trigger_update_recurring_maintenances_updated_at ON recurring_maintenances;
CREATE TRIGGER trigger_update_recurring_maintenances_updated_at
  BEFORE UPDATE ON recurring_maintenances
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_updated_at();

DROP TRIGGER IF EXISTS trigger_update_technician_contacts_updated_at ON technician_contacts;
CREATE TRIGGER trigger_update_technician_contacts_updated_at
  BEFORE UPDATE ON technician_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_updated_at();

-- =====================================================
-- FUNCTION: XP ao reportar item
-- =====================================================
CREATE OR REPLACE FUNCTION award_report_maintenance_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- +5 XP por reportar item (identificar problema)
  UPDATE profiles
  SET total_points = total_points + 5
  WHERE id = NEW.created_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_report_maintenance_xp ON maintenance_items;
CREATE TRIGGER trigger_award_report_maintenance_xp
  AFTER INSERT ON maintenance_items
  FOR EACH ROW
  EXECUTE FUNCTION award_report_maintenance_xp();

-- =====================================================
-- FUNCTION: XP ao assumir tarefa
-- =====================================================
CREATE OR REPLACE FUNCTION award_assign_maintenance_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando alguém assume tarefa pela primeira vez
  IF NEW.assigned_to IS NOT NULL AND OLD.assigned_to IS NULL THEN
    -- +5 XP por assumir responsabilidade
    UPDATE profiles
    SET total_points = total_points + 5
    WHERE id = NEW.assigned_to;
    
    -- Criar update no histórico
    INSERT INTO maintenance_updates (
      maintenance_item_id, user_id, content, update_type
    ) VALUES (
      NEW.id, 
      NEW.assigned_to, 
      'Assumiu a tarefa',
      'assignment'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_assign_maintenance_xp ON maintenance_items;
CREATE TRIGGER trigger_award_assign_maintenance_xp
  AFTER UPDATE ON maintenance_items
  FOR EACH ROW
  WHEN (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to)
  EXECUTE FUNCTION award_assign_maintenance_xp();

-- =====================================================
-- FUNCTION: XP ao resolver item
-- =====================================================
CREATE OR REPLACE FUNCTION award_resolve_maintenance_xp()
RETURNS TRIGGER AS $$
DECLARE
  xp_amount INTEGER;
BEGIN
  -- Quando item é marcado como resolvido
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    -- Calcular XP baseado em prioridade e tipo
    xp_amount := CASE
      WHEN NEW.priority = 'urgent' THEN 100   -- Urgente
      WHEN NEW.priority = 'important' THEN 50 -- Importante
      ELSE 30                                  -- Quando der
    END;
    
    -- DIY ganha mais XP
    IF NEW.action_type = 'diy' THEN
      xp_amount := xp_amount + 20;
    END IF;
    
    -- Dar XP para quem resolveu
    IF NEW.resolved_by IS NOT NULL THEN
      UPDATE profiles
      SET total_points = total_points + xp_amount
      WHERE id = NEW.resolved_by;
      
      -- Criar entrada no histórico
      INSERT INTO maintenance_history (
        household_id,
        maintenance_item_id,
        title,
        location,
        performed_by,
        cost,
        time_spent_minutes,
        photos,
        description
      ) VALUES (
        NEW.household_id,
        NEW.id,
        NEW.title,
        NEW.location,
        NEW.resolved_by,
        NEW.actual_cost,
        NEW.time_spent_minutes,
        NEW.photos,
        NEW.description
      );
      
      -- Criar update
      INSERT INTO maintenance_updates (
        maintenance_item_id, user_id, content, update_type
      ) VALUES (
        NEW.id,
        NEW.resolved_by,
        'Resolveu o problema',
        'completion'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_resolve_maintenance_xp ON maintenance_items;
CREATE TRIGGER trigger_award_resolve_maintenance_xp
  AFTER UPDATE ON maintenance_items
  FOR EACH ROW
  WHEN (NEW.status = 'resolved' AND OLD.status IS DISTINCT FROM 'resolved')
  EXECUTE FUNCTION award_resolve_maintenance_xp();

-- =====================================================
-- FUNCTION: XP ao completar manutenção preventiva
-- =====================================================
CREATE OR REPLACE FUNCTION award_preventive_maintenance_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando registra manutenção preventiva
  IF NEW.recurring_maintenance_id IS NOT NULL THEN
    -- +30 XP por manutenção preventiva (incentiva cuidado)
    UPDATE profiles
    SET total_points = total_points + 30
    WHERE id = NEW.performed_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_preventive_maintenance_xp ON maintenance_history;
CREATE TRIGGER trigger_award_preventive_maintenance_xp
  AFTER INSERT ON maintenance_history
  FOR EACH ROW
  WHEN (NEW.recurring_maintenance_id IS NOT NULL)
  EXECUTE FUNCTION award_preventive_maintenance_xp();

-- =====================================================
-- FUNCTION: Atualizar próxima data de manutenção
-- =====================================================
CREATE OR REPLACE FUNCTION update_next_maintenance_date()
RETURNS TRIGGER AS $$
DECLARE
  recurring_rec RECORD;
BEGIN
  -- Quando uma manutenção recorrente é completada
  IF NEW.recurring_maintenance_id IS NOT NULL THEN
    -- Buscar dados da manutenção recorrente
    SELECT * INTO recurring_rec
    FROM recurring_maintenances
    WHERE id = NEW.recurring_maintenance_id::UUID;
    
    IF FOUND THEN
      -- Atualizar próxima data
      UPDATE recurring_maintenances
      SET 
        last_performed_at = NEW.performed_at,
        next_due_date = CASE
          WHEN frequency_type = 'days' THEN 
            NEW.performed_at + (frequency_value || ' days')::INTERVAL
          WHEN frequency_type = 'weeks' THEN 
            NEW.performed_at + (frequency_value || ' weeks')::INTERVAL
          WHEN frequency_type = 'months' THEN 
            NEW.performed_at + (frequency_value || ' months')::INTERVAL
          WHEN frequency_type = 'years' THEN 
            NEW.performed_at + (frequency_value || ' years')::INTERVAL
        END
      WHERE id = NEW.recurring_maintenance_id::UUID;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_next_maintenance ON maintenance_history;
CREATE TRIGGER trigger_update_next_maintenance
  AFTER INSERT ON maintenance_history
  FOR EACH ROW
  WHEN (NEW.recurring_maintenance_id IS NOT NULL)
  EXECUTE FUNCTION update_next_maintenance_date();

-- =====================================================
-- RLS POLICIES: maintenance_items
-- =====================================================

ALTER TABLE maintenance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view items"
  ON maintenance_items FOR SELECT
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

CREATE POLICY "Household members can create items"
  ON maintenance_items FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Household members can update items"
  ON maintenance_items FOR UPDATE
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

CREATE POLICY "Creator can delete items"
  ON maintenance_items FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- =====================================================
-- RLS POLICIES: maintenance_history
-- =====================================================

ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view history"
  ON maintenance_history FOR SELECT
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

CREATE POLICY "System can create history"
  ON maintenance_history FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

-- =====================================================
-- RLS POLICIES: recurring_maintenances
-- =====================================================

ALTER TABLE recurring_maintenances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view recurring"
  ON recurring_maintenances FOR SELECT
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

CREATE POLICY "Household members can create recurring"
  ON recurring_maintenances FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Household members can update recurring"
  ON recurring_maintenances FOR UPDATE
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

CREATE POLICY "Creator can delete recurring"
  ON recurring_maintenances FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- =====================================================
-- RLS POLICIES: maintenance_updates
-- =====================================================

ALTER TABLE maintenance_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view updates"
  ON maintenance_updates FOR SELECT
  TO authenticated
  USING (
    maintenance_item_id IN (
      SELECT id FROM maintenance_items
      WHERE household_id IN (
        SELECT household_id FROM profiles
        WHERE id = auth.uid() AND household_id IS NOT NULL
      )
    )
  );

CREATE POLICY "System can create updates"
  ON maintenance_updates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: technician_contacts
-- =====================================================

ALTER TABLE technician_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view contacts"
  ON technician_contacts FOR SELECT
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

CREATE POLICY "Household members can create contacts"
  ON technician_contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Household members can update contacts"
  ON technician_contacts FOR UPDATE
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles
      WHERE id = auth.uid() AND household_id IS NOT NULL
    )
  );

CREATE POLICY "Creator can delete contacts"
  ON technician_contacts FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE maintenance_items IS 'Itens de manutenção e reparos da casa';
COMMENT ON TABLE maintenance_history IS 'Histórico permanente de todas as manutenções realizadas';
COMMENT ON TABLE recurring_maintenances IS 'Manutenções preventivas com lembretes automáticos';
COMMENT ON TABLE maintenance_updates IS 'Timeline de atualizações de cada item de manutenção';
COMMENT ON TABLE technician_contacts IS 'Contatos de técnicos e prestadores de serviço';

