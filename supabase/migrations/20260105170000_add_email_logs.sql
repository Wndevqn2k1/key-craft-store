-- Create email_logs table to track all sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL, -- 'order_confirmation', 'deposit_approved', 'deposit_rejected', 'welcome'
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB, -- Store order_id, deposit_id, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own email logs
CREATE POLICY "Users can view their own email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only service role can insert email logs (from Edge Functions)
CREATE POLICY "Service role can insert email logs"
  ON email_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

COMMENT ON TABLE email_logs IS 'Stores history of all emails sent by the system';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email: order_confirmation, deposit_approved, deposit_rejected, welcome';
COMMENT ON COLUMN email_logs.metadata IS 'Additional data like order_id, deposit_id, amount, etc.';
