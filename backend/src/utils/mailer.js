import nodemailer from 'nodemailer';

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const brevoApiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: smtpConfigured
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false
  }
});

async function sendViaBrevoApi(email, otp) {
  if (!brevoApiKey) return false;
  try {
    const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@civicvoice.local';
    const fromName = process.env.MAIL_FROM_NAME || 'CivicVoice';
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email }],
        subject: 'CivicVoice — Verification OTP',
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#0f172a">
            <h2 style="margin-top:0;margin-bottom:4px">CivicVoice</h2>
            <p style="color:#64748b;margin-top:0">Email Verification</p>
            <p>Your OTP is:</p>
            <p style="font-size:28px;font-weight:700;letter-spacing:6px;text-align:center">${otp}</p>
            <p>It is valid for <strong>10 minutes</strong>. If you didn't request this, you can ignore this email.</p>
          </div>`,
        textContent: `Your CivicVoice OTP is ${otp}. It is valid for 10 minutes. If you did not request this, you can safely ignore this email.`
      })
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('BREVO API ERROR:', res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.error('BREVO API ERROR:', err.message);
    return false;
  }
}

export async function sendOtp(email, otp) {
  // Try Brevo API first (works on Render)
  if (await sendViaBrevoApi(email, otp)) {
    return { dev: false, sent: true, provider: 'brevo-api' };
  }

  if (!smtpConfigured) {
    console.log('\n==============================================');
    console.log('[DEV MODE] No SMTP configured — email NOT sent.');
    console.log(`OTP for ${email}:`);
    console.log(`   >>>  ${otp}  <<<`);
    console.log('Valid for 10 minutes.');
    console.log('==============================================\n');
    return { dev: true };
  }

  try {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    await transport.sendMail({
      from,
      to: email,
      subject: 'CivicVoice — Verification OTP',
      text: `Your CivicVoice OTP is ${otp}. It is valid for 10 minutes. If you did not request this, you can safely ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#0f172a">
          <h2 style="margin-top:0;margin-bottom:4px">CivicVoice</h2>
          <p style="color:#64748b;margin-top:0">Email Verification</p>
          <p>Your OTP is:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:6px;text-align:center">${otp}</p>
          <p>It is valid for <strong>10 minutes</strong>. If you didn't request this, you can ignore this email.</p>
        </div>`
    });
    return { dev: false, sent: true, provider: 'smtp' };
  } catch (err) {
    console.error('SEND OTP EMAIL ERROR:', err.message);
    return { dev: false, sent: false, error: err.message };
  }
}
