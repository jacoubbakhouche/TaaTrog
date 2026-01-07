-- Add gallery_images column to checkers table
ALTER TABLE public.checkers 
ADD COLUMN gallery_images text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.checkers.gallery_images IS 'Array of image URLs for checker photo gallery';