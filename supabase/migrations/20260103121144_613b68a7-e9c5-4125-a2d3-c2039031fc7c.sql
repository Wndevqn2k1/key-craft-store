-- Create deposit status enum
CREATE TYPE public.deposit_status AS ENUM ('pending', 'approved', 'rejected');

-- Create deposits table
CREATE TABLE public.deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  transfer_content TEXT,
  status deposit_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposits
CREATE POLICY "Users can view their own deposits"
ON public.deposits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own deposit requests
CREATE POLICY "Users can create their own deposits"
ON public.deposits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all deposits
CREATE POLICY "Admins can view all deposits"
ON public.deposits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update deposits (approve/reject)
CREATE POLICY "Admins can update deposits"
ON public.deposits
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_deposits_updated_at
BEFORE UPDATE ON public.deposits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();