-- Function to calculate and update checker stats
CREATE OR REPLACE FUNCTION public.update_checker_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine checker_id (from NEW on Insert/Update, OLD on Delete)
  DECLARE
    target_checker_id UUID;
  BEGIN
    IF (TG_OP = 'DELETE') THEN
      target_checker_id := OLD.checker_id;
    ELSE
      target_checker_id := NEW.checker_id;
    END IF;

    -- Update the checker with new aggregate stats
    UPDATE public.checkers
    SET 
      rating = (
        SELECT COALESCE(ROUND(AVG(rating), 1), 0)
        FROM public.reviews
        WHERE checker_id = target_checker_id
      ),
      reviews_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE checker_id = target_checker_id
      )
    WHERE id = target_checker_id;

    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Insert, Update, Delete on reviews
DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_checker_review_stats();

-- Backfill existing data
UPDATE public.checkers c
SET 
  rating = (
    SELECT COALESCE(ROUND(AVG(rating), 1), 0)
    FROM public.reviews
    WHERE checker_id = c.id
  ),
  reviews_count = (
    SELECT COUNT(*)
    FROM public.reviews
    WHERE checker_id = c.id
  );
