-- Create banners table for hero slider
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  button_text TEXT DEFAULT 'Khám phá ngay',
  button_url TEXT DEFAULT '/products',
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active banners"
ON public.banners FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all banners"
ON public.banners FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert banners"
ON public.banners FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update banners"
ON public.banners FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete banners"
ON public.banners FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default banner
INSERT INTO public.banners (title, subtitle, description, button_text, button_url, display_order)
VALUES (
  'KEY BẢN QUYỀN CHÍNH HÃNG',
  'Giao key tự động 24/7',
  'Cung cấp key phần mềm, game, tài khoản premium với giá tốt nhất. Kích hoạt nhanh chóng, bảo hành uy tín, hỗ trợ tận tình.',
  'Khám phá ngay',
  '/products',
  1
);