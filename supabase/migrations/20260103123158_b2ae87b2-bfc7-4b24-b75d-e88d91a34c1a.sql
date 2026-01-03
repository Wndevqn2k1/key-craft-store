-- Create site_settings table
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings (for displaying on site)
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Only admins can insert settings
CREATE POLICY "Admins can insert site settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update settings
CREATE POLICY "Admins can update site settings" 
ON public.site_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete settings
CREATE POLICY "Admins can delete site settings" 
ON public.site_settings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'KEYSTORE'),
  ('site_title', 'KeyStore - Cửa hàng Key bản quyền'),
  ('logo_url', ''),
  ('contact_email', 'contact@keystore.vn'),
  ('contact_phone', '0123 456 789'),
  ('contact_address', '123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh'),
  ('facebook_url', ''),
  ('zalo_url', ''),
  ('bank_name', 'Vietcombank'),
  ('bank_account', '1234567890'),
  ('bank_holder', 'NGUYEN VAN A');