-- =====================================================
-- DEDUCT POINTS WHEN SHOPPING ITEM IS DELETED
-- =====================================================
-- 
-- When a shopping item is deleted, deduct the 5 XP that was
-- awarded when the item was added (if it hasn't been purchased yet)
--

-- Function to deduct points when shopping item is deleted
CREATE OR REPLACE FUNCTION deduct_shopping_item_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only deduct points if item hasn't been purchased yet
  -- (purchased items shouldn't have points deducted when deleted)
  IF OLD.is_purchased = FALSE AND OLD.added_by IS NOT NULL THEN
    -- Deduct 5 XP from the user who added the item
    UPDATE profiles
    SET total_points = GREATEST(0, total_points - 5)
    WHERE id = OLD.added_by;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to deduct points when item is deleted
CREATE TRIGGER on_shopping_item_deleted
  BEFORE DELETE ON shopping_items
  FOR EACH ROW
  EXECUTE FUNCTION deduct_shopping_item_points();

COMMENT ON FUNCTION deduct_shopping_item_points IS 
  'Deducts 5 XP from the user who added a shopping item when it is deleted (only if not purchased)';

