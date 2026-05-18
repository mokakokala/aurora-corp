import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const FIRST_CODE = '292929'
const AUTHORIZED_EMAILS = ['mokakokala@gmail.com', 'matthieub117@gmail.com']
const OTP_EXPIRY_MINUTES = 15

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { firstCode, emailIndex } = await req.json()

    if (firstCode !== FIRST_CODE) {
      return new Response(
        JSON.stringify({ success: false, error: 'Code invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (typeof emailIndex !== 'number' || emailIndex < 0 || emailIndex >= AUTHORIZED_EMAILS.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'Destinataire invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const targetEmail = AUTHORIZED_EMAILS[emailIndex]

    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(otp))
    const otpHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()

    const { error: insertError } = await supabase.from('admin_otp').insert([{
      otp_hash: otpHash,
      expires_at: expiresAt,
      used: false,
    }])

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur interne' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const brevoApiKey = Deno.env.get('BREVO_API_KEY')!
    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'A.U.R.O.R.A CORP', email: AUTHORIZED_EMAILS[0] },
        to: [{ email: targetEmail }],
        subject: "A.U.R.O.R.A — Code d'accès administrateur",
        htmlContent: `
          <div style="background:#000;color:#f97316;font-family:monospace;padding:32px;border:1px solid rgba(249,115,22,0.5);max-width:420px;">
            <p style="font-size:11px;letter-spacing:0.4em;color:#7c2d12;text-transform:uppercase;margin:0 0 8px;">— TRANSMISSION SÉCURISÉE —</p>
            <h2 style="color:#fb923c;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 20px;font-size:16px;">A.U.R.O.R.A CORP</h2>
            <p style="color:#fed7aa;letter-spacing:0.1em;font-size:12px;margin:0 0 20px;">Code d'accès — Valable ${OTP_EXPIRY_MINUTES} minutes</p>
            <div style="background:#0a0400;border:2px solid #f97316;padding:24px;text-align:center;margin:0 0 20px;">
              <span style="font-size:40px;letter-spacing:0.6em;color:#fb923c;font-weight:bold;">${otp}</span>
            </div>
            <p style="color:#7c3d12;font-size:11px;margin:0;">Ne partagez pas ce code. Il expire dans ${OTP_EXPIRY_MINUTES} minutes.</p>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      const emailErr = await emailRes.text()
      console.error('Brevo error:', emailErr)
      return new Response(
        JSON.stringify({ success: false, error: "Erreur d'envoi email" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
