-- =====================================================
-- SHOPPING LIST SYSTEM - Gamified Grocery Management
-- =====================================================

-- Create shopping_items table
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('alimentos', 'limpeza', 'higiene', 'outros')) DEFAULT 'outros',
  emoji TEXT DEFAULT '🛒',
  
  -- Who reported it
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Purchase tracking
  is_purchased BOOLEAN DEFAULT FALSE NOT NULL,
  purchased_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ,
  
  -- Optional notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_shopping_items_household ON shopping_items(household_id);
CREATE INDEX idx_shopping_items_status ON shopping_items(household_id, is_purchased);
CREATE INDEX idx_shopping_items_added_at ON shopping_items(added_at DESC);

-- Enable RLS
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view household shopping items"
  ON shopping_items FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can add shopping items"
  ON shopping_items FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update household shopping items"
  ON shopping_items FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete household shopping items"
  ON shopping_items FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- GAMIFICATION: XP REWARDS
-- =====================================================

-- Function to reward user when reporting missing item (+5 XP)
CREATE OR REPLACE FUNCTION reward_shopping_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Add 5 XP to the user who reported the item
  IF NEW.added_by IS NOT NULL THEN
    UPDATE profiles
    SET total_points = total_points + 5
    WHERE id = NEW.added_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to reward reporting
CREATE TRIGGER on_shopping_item_reported
  AFTER INSERT ON shopping_items
  FOR EACH ROW
  EXECUTE FUNCTION reward_shopping_report();

-- =====================================================
-- RPC: Complete Shopping Trip
-- =====================================================

-- Function to complete a shopping trip and reward XP
-- Base: +50 XP + 5 XP per item
CREATE OR REPLACE FUNCTION complete_shopping_trip(
  p_item_ids UUID[],
  p_user_id UUID
)
RETURNS TABLE(
  items_count INTEGER,
  xp_earned INTEGER
) AS $$
DECLARE
  v_items_count INTEGER;
  v_xp_total INTEGER;
  v_xp_base INTEGER := 50;
  v_xp_per_item INTEGER := 5;
  v_household_id UUID;
BEGIN
  -- Get user's household
  SELECT household_id INTO v_household_id
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'User has no household';
  END IF;
  
  -- Count valid items (not purchased yet, from same household)
  SELECT COUNT(*) INTO v_items_count
  FROM shopping_items
  WHERE id = ANY(p_item_ids)
    AND household_id = v_household_id
    AND is_purchased = FALSE;
  
  -- If no items, return 0
  IF v_items_count = 0 THEN
    RETURN QUERY SELECT 0, 0;
    RETURN;
  END IF;
  
  -- Calculate total XP
  v_xp_total := v_xp_base + (v_items_count * v_xp_per_item);
  
  -- Mark items as purchased
  UPDATE shopping_items
  SET 
    is_purchased = TRUE,
    purchased_by = p_user_id,
    purchased_at = NOW()
  WHERE id = ANY(p_item_ids)
    AND household_id = v_household_id
    AND is_purchased = FALSE;
  
  -- Add XP to user
  UPDATE profiles
  SET total_points = total_points + v_xp_total
  WHERE id = p_user_id;
  
  -- Return results
  RETURN QUERY SELECT v_items_count, v_xp_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION complete_shopping_trip TO authenticated;

-- =====================================================
-- HELPER FUNCTION: Get Frequent Items
-- =====================================================

-- Function to get most frequently purchased items for autocomplete
CREATE OR REPLACE FUNCTION get_frequent_shopping_items(p_household_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  name TEXT,
  category TEXT,
  emoji TEXT,
  purchase_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.name,
    si.category,
    si.emoji,
    COUNT(*) as purchase_count
  FROM shopping_items si
  WHERE si.household_id = p_household_id
    AND si.is_purchased = TRUE
  GROUP BY si.name, si.category, si.emoji
  ORDER BY purchase_count DESC, si.name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_frequent_shopping_items TO authenticated;

-- Comments
COMMENT ON TABLE shopping_items IS 'Shopping list items with gamification tracking';
COMMENT ON COLUMN shopping_items.category IS 'Item category: alimentos, limpeza, higiene, outros';
COMMENT ON COLUMN shopping_items.emoji IS 'Visual emoji for the item';
COMMENT ON FUNCTION complete_shopping_trip IS 'Complete shopping trip and award XP: 50 base + 5 per item';
COMMENT ON FUNCTION reward_shopping_report IS 'Award 5 XP when user reports missing item';
COMMENT ON FUNCTION get_frequent_shopping_items IS 'Get most frequently purchased items for autocomplete';


