import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface DepositEmailData {
  depositId: string
  userEmail: string
  userName: string
  userId: string
  amount: number
  status: 'approved' | 'rejected'
  adminNote?: string
  newBalance?: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { depositId, userEmail, userName, userId, amount, status, adminNote, newBalance }: DepositEmailData = await req.json()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Build email based on status
    let subject: string
    let emailHtml: string

    if (status === 'approved') {
      subject = `✅ Nạp tiền thành công +${new Intl.NumberFormat('vi-VN').format(amount)} VND`
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
              .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
              .info-label { color: #6b7280; }
              .info-value { font-weight: bold; color: #111827; }
              .balance { font-size: 32px; color: #10b981; font-weight: bold; text-align: center; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💰 Nạp tiền thành công!</h1>
                <p>Số dư của bạn đã được cập nhật</p>
              </div>
              <div class="content">
                <p>Xin chào <strong>${userName}</strong>,</p>
                <p>Yêu cầu nạp tiền của bạn đã được xử lý thành công!</p>
                
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">Mã giao dịch:</span>
                    <span class="info-value">#${depositId.slice(0, 8)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Số tiền nạp:</span>
                    <span class="info-value" style="color: #10b981;">+${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</span>
                  </div>
                  ${newBalance ? `
                  <div class="info-row">
                    <span class="info-label">Số dư mới:</span>
                    <span class="info-value">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(newBalance)}</span>
                  </div>
                  ` : ''}
                </div>
                
                <p style="text-align: center; margin: 30px 0;">
                  Bạn có thể sử dụng số dư này để mua key ngay bây giờ!
                </p>
                
                <div style="text-align: center;">
                  <a href="https://muahackvip.com/products" class="button">Mua sản phẩm ngay</a>
                </div>
                
                <div class="footer">
                  <p><strong>GOODTEAM - Mua Key Bản Quyền Uy Tín</strong></p>
                  <p>Website: <a href="https://muahackvip.com">muahackvip.com</a></p>
                  <p>Hỗ trợ 24/7 - Giao hàng tự động</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    } else {
      subject = `❌ Yêu cầu nạp tiền bị từ chối`
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
              .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>❌ Yêu cầu nạp tiền bị từ chối</h1>
              </div>
              <div class="content">
                <p>Xin chào <strong>${userName}</strong>,</p>
                <p>Rất tiếc, yêu cầu nạp tiền của bạn đã bị từ chối.</p>
                
                <div class="info-box">
                  <p><strong>Mã giao dịch:</strong> #${depositId.slice(0, 8)}</p>
                  <p><strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</p>
                  ${adminNote ? `<p><strong>Lý do:</strong> ${adminNote}</p>` : ''}
                </div>
                
                <div class="warning-box">
                  <strong>⚠️ Nguyên nhân thường gặp:</strong>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Nội dung chuyển khoản không chính xác</li>
                    <li>Số tiền chuyển khoản không khớp</li>
                    <li>Không tìm thấy giao dịch trong hệ thống ngân hàng</li>
                    <li>Thông tin tài khoản không hợp lệ</li>
                  </ul>
                </div>
                
                <p style="margin-top: 30px;">Vui lòng kiểm tra lại thông tin và thực hiện nạp tiền lại hoặc liên hệ hỗ trợ để được giúp đỡ.</p>
                
                <div style="text-align: center;">
                  <a href="https://muahackvip.com/deposit" class="button">Nạp tiền lại</a>
                </div>
                
                <div class="footer">
                  <p><strong>GOODTEAM - Hỗ trợ 24/7</strong></p>
                  <p>Website: <a href="https://muahackvip.com">muahackvip.com</a></p>
                  <p>Liên hệ: support@muahackvip.com</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    }

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'GOODTEAM <noreply@muahackvip.com>',
        to: userEmail,
        subject: subject,
        html: emailHtml,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      throw new Error(`Resend error: ${resendData.message || 'Unknown error'}`)
    }

    // Log email to database
    await supabase.from('email_logs').insert({
      user_id: userId,
      email_type: status === 'approved' ? 'deposit_approved' : 'deposit_rejected',
      recipient_email: userEmail,
      subject: subject,
      status: 'sent',
      metadata: {
        deposit_id: depositId,
        resend_id: resendData.id,
        amount: amount,
        admin_note: adminNote,
      },
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        resend_id: resendData.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending deposit email:', error)

    // Try to log failed email
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const { userEmail, userId, depositId, status } = await req.json()
      
      await supabase.from('email_logs').insert({
        user_id: userId,
        email_type: status === 'approved' ? 'deposit_approved' : 'deposit_rejected',
        recipient_email: userEmail,
        subject: status === 'approved' ? 'Nạp tiền thành công' : 'Yêu cầu nạp tiền bị từ chối',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        metadata: { deposit_id: depositId },
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
