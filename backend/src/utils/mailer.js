import nodemailer from 'nodemailer';

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: smtpConfigured
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined
});

export async function sendOtp(email, otp) {
  if (!smtpConfigured) {
    console.log('\n==============================================');
    console.log('[DEV MODE] No SMTP configured — email NOT sent.');
    console.log(`OTP for ${email}:`);
    console.log(`   >>>  ${otp}  <<<`);
    console.log('Valid for 10 minutes.');
    console.log('==============================================\n');
    return { dev: true };
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  await transport.sendMail({
    from,
    to: email,
    subject: 'CivicVoice — Password Reset OTP',
    text: `Your CivicVoice password reset OTP is ${otp}. It is valid for 10 minutes. If you did not request this, you can safely ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#0f172a">
        <h2 style="margin-top:0;margin-bottom:4px">CivicVoice</h2>
        <p style="color:#64748b;margin-top:0">Reset your password</p>
        <p>Your password reset OTP is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;text-align:center">${otp}</p>
        <p>It is valid for <strong>10 minutes</strong>. If you didn't request this, you can ignore this email.</p>
      </div>`
  });
  return { dev: false };
}
