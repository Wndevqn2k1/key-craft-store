import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface OrderEmailData {
  orderId: string
  userEmail: string
  userName: string
  userId: string
  keys: Array<{
    productName: string
    duration: string
    keyValue: string
  }>
  totalAmount: number
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
    const { orderId, userEmail, userName, userId, keys, totalAmount }: OrderEmailData = await req.json()

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .key-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; border-radius: 4px; }
            .key-label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
            .key-value { font-family: monospace; background: #f3f4f6; padding: 8px; border-radius: 4px; word-break: break-all; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Đơn hàng thành công!</h1>
              <p>Cảm ơn bạn đã mua hàng tại GOODTEAM</p>
            </div>
            <div class="content">
              <p>Xin chào <strong>${userName}</strong>,</p>
              <p>Đơn hàng <strong>#${orderId.slice(0, 8)}</strong> của bạn đã được xử lý thành công!</p>
              
              <h2 style="color: #667eea; margin-top: 30px;">🔑 Key của bạn:</h2>
              ${keys.map(key => `
                <div class="key-box">
                  <div class="key-label">${key.productName} - ${key.duration}</div>
                  <div class="key-value">${key.keyValue}</div>
                </div>
              `).join('')}
              
              <p style="margin-top: 30px;"><strong>Tổng thanh toán:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>⚠️ Lưu ý quan trọng:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Vui lòng lưu lại key, không chia sẻ với người khác</li>
                  <li>Key có thời hạn sử dụng, vui lòng kích hoạt sớm</li>
                  <li>Liên hệ hỗ trợ nếu gặp vấn đề khi sử dụng</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="https://muahackvip.com/profile" class="button">Xem lịch sử đơn hàng</a>
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
        subject: `✅ Đơn hàng #${orderId.slice(0, 8)} - Key của bạn đã sẵn sàng!`,
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
      email_type: 'order_confirmation',
      recipient_email: userEmail,
      subject: `✅ Đơn hàng #${orderId.slice(0, 8)} - Key của bạn đã sẵn sàng!`,
      status: 'sent',
      metadata: {
        order_id: orderId,
        resend_id: resendData.id,
        keys_count: keys.length,
        total_amount: totalAmount,
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
    console.error('Error sending email:', error)

    // Try to log failed email
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const { userEmail, userId, orderId } = await req.json()
      
      await supabase.from('email_logs').insert({
        user_id: userId,
        email_type: 'order_confirmation',
        recipient_email: userEmail,
        subject: `✅ Đơn hàng #${orderId?.slice(0, 8)} - Key của bạn đã sẵn sàng!`,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        metadata: { order_id: orderId },
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
