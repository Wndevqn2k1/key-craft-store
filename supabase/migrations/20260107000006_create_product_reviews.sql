-- Create product_reviews table with RLS policies
-- This allows users to review products they've purchased

-- Step 1: Create the product_reviews table
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  verified_purchase boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 2: Create indexes for better performance
CREATE INDEX product_reviews_product_id_idx ON public.product_reviews(product_id);
CREATE INDEX product_reviews_user_id_idx ON public.product_reviews(user_id);
CREATE INDEX product_reviews_created_at_idx ON public.product_reviews(created_at DESC);

-- Step 3: Add unique constraint (one review per user per product)
ALTER TABLE public.product_reviews
ADD CONSTRAINT product_reviews_user_product_unique UNIQUE (user_id, product_id);

-- Step 4: Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" ON public.product_reviews
  FOR SELECT
  USING (true);

-- Users can create reviews for their own account
CREATE POLICY "Users can create own reviews" ON public.product_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON public.product_reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON public.product_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all reviews" ON public.product_reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Step 6: Create function to auto-mark verified purchase
CREATE OR REPLACE FUNCTION check_verified_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has completed order for this product
  NEW.verified_purchase := EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    WHERE o.user_id = NEW.user_id
    AND oi.product_id = NEW.product_id
    AND o.status = 'completed'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger to check verified purchase
CREATE TRIGGER set_verified_purchase
  BEFORE INSERT ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION check_verified_purchase();

-- Step 8: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_updated_at();

-- Step 10: Add comments for documentation
COMMENT ON TABLE public.product_reviews IS 'Product reviews with ratings and comments from users';
COMMENT ON COLUMN public.product_reviews.verified_purchase IS 'True if user has purchased this product';
COMMENT ON COLUMN public.product_reviews.helpful_count IS 'Number of users who found this review helpful';
