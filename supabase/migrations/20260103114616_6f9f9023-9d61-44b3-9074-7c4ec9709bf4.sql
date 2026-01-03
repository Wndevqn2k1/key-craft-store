-- Create categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text DEFAULT 'Sparkles',
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories" 
ON public.categories 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories" 
ON public.categories 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO public.categories (name, slug, icon, display_order) VALUES
  ('Windows', 'windows', 'Monitor', 1),
  ('Office', 'office', 'FileText', 2),
  ('Phần mềm', 'toolhack', 'Sparkles', 3);