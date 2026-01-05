-- Add music_url to site_settings table
INSERT INTO site_settings (key, value)
VALUES ('music_url', '')
ON CONFLICT (key) DO NOTHING;
