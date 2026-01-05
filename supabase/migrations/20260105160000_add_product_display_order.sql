-- Add display_order and is_featured to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;

-- Update existing products with incremental display_order based on created_at
WITH numbered_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM products
)
UPDATE products
SET display_order = np.rn
FROM numbered_products np
WHERE products.id = np.id;
