-- Function to recalculate tests_count for a checker
CREATE OR REPLACE FUNCTION public.update_checker_tests_count()
RETURNS TRIGGER AS $$
BEGIN
  -- We recalculate for the affected checker(s)
  -- If it's an underlying UPDATE, we might need to check OLD.checker_id and NEW.checker_id
  IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
    UPDATE public.checkers
    SET tests_count = (
      SELECT COUNT(*)
      FROM public.conversations
      WHERE checker_id = NEW.checker_id
      AND status = 'paid' -- Counting 'paid' conversations as "Tests Performed" (Confirmed orders)
    )
    WHERE id = NEW.checker_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on conversations
DROP TRIGGER IF EXISTS on_conversation_status_change ON public.conversations;
CREATE TRIGGER on_conversation_status_change
  AFTER INSERT OR UPDATE OF status, checker_id ON public.conversations
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_checker_tests_count();

-- Optional: Initial Calculation (Backfill)
UPDATE public.checkers c
SET tests_count = (
  SELECT COUNT(*)
  FROM public.conversations
  WHERE checker_id = c.id
  AND status = 'paid'
);
