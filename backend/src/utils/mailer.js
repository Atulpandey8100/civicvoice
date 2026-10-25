import nodemailer from 'nodemailer';

const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);
const brevoApiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
// Render sets RENDER=true even when NODE_ENV is not configured, so don't rely
// on NODE_ENV alone — otherwise production silently falls back to dev mode.
const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.RENDER === 'true' ||
  Boolean(process.env.RENDER_SERVICE_ID);

const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
const mailFromName = process.env.MAIL_FROM_NAME || 'CivicVoice';

console.log(
  `[mailer] production=${isProduction} brevo=${brevoApiKey ? 'configured' : 'missing'} ` +
  `smtp=${smtpConfigured ? 'configured' : 'missing'} from=${mailFrom ? 'set' : 'missing'}`
);

const subject = 'CivicVoice — Verification OTP';
const textBody = (otp) =>
  `Your CivicVoice OTP is ${otp}. It is valid for 10 minutes. If you did not request this, you can safely ignore this email.`;
const htmlBody = (otp) => `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;color:#0f172a">
            <h2 style="margin-top:0;margin-bottom:4px">CivicVoice</h2>
            <p style="color:#64748b;margin-top:0">Email Verification</p>
            <p>Your OTP is:</p>
            <p style="font-size:28px;font-weight:700;letter-spacing:6px;text-align:center">${otp}</p>
            <p>It is valid for <strong>10 minutes</strong>. If you didn't request this, you can ignore this email.</p>
          </div>`;

const transport = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    })
  : null;

async function sendViaBrevoApi(email, otp) {
  if (!brevoApiKey) {
    return { ok: false, reason: 'BREVO_API_KEY is not set' };
  }
  if (!mailFrom) {
    return { ok: false, reason: 'MAIL_FROM is not set' };
  }
  try {
    console.log('BREVO API: sending OTP to', email, 'from', mailFrom);
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: mailFromName, email: mailFrom },
        to: [{ email }],
        subject,
        htmlContent: htmlBody(otp),
        textContent: textBody(otp)
      })
    });
    const body = await res.text();
    if (!res.ok) {
      console.error('BREVO API ERROR:', res.status, body);
      if (res.status === 403) {
        console.error(
          'BREVO API HINT: the key is valid but cannot send transactional email. ' +
          'Use an API key (starts with xkeysib-), not an SMTP key (xsmtpsib-), ' +
          'and disable IP restrictions on the key in Brevo > SMTP & API > API Keys.'
        );
      }
      if (res.status === 401 && /unrecogni[sz]ed IP|authori[sz]ed_ips/i.test(body)) {
        console.error(
          'BREVO API HINT: Brevo is blocking this server\'s IP address. Authorize Render\'s ' +
          'outbound IP ranges at https://app.brevo.com/security/authorised_ips, ' +
          'or deactivate API IP blocking in Brevo > Settings > Security > Authorized IPs.'
        );
      }
      return { ok: false, reason: `Brevo API ${res.status}: ${body}` };
    }
    console.log('BREVO API SUCCESS:', res.status, body);
    return { ok: true };
  } catch (err) {
    console.error('BREVO API ERROR:', err.message);
    return { ok: false, reason: err.message };
  }
}

async function sendViaSmtp(email, otp) {
  if (!transport) {
    return { ok: false, reason: 'SMTP is not configured' };
  }
  try {
    await transport.sendMail({
      from: mailFrom,
      to: email,
      subject,
      text: textBody(otp),
      html: htmlBody(otp)
    });
    return { ok: true };
  } catch (err) {
    console.error('SEND OTP EMAIL ERROR:', err.message);
    return { ok: false, reason: err.message };
  }
}

export async function sendOtp(email, otp) {
  // Render (and most PaaS free tiers) block outbound SMTP ports. In production
  // only use the Brevo HTTP API when a key is configured, otherwise SMTP.
  // Locally, try SMTP first and fall back to the API.
  const attempts = isProduction
    ? brevoApiKey
      ? [['brevo-api', sendViaBrevoApi]]
      : [['smtp', sendViaSmtp]]
    : [['smtp', sendViaSmtp], ['brevo-api', sendViaBrevoApi]];

  const errors = [];
  for (const [provider, send] of attempts) {
    const result = await send(email, otp);
    if (result.ok) {
      console.log(`OTP email sent via ${provider} to ${email}`);
      return { dev: false, sent: true, provider };
    }
    errors.push(`${provider}: ${result.reason}`);
  }

  if (!isProduction) {
    console.log('\n==============================================');
    console.log('[DEV MODE] Email NOT sent — no working email provider.');
    console.log(`OTP for ${email}:`);
    console.log(`   >>>  ${otp}  <<<`);
    console.log('Valid for 10 minutes.');
    console.log('==============================================\n');
    return { dev: true, sent: false };
  }

  console.error('OTP EMAIL FAILED:', errors.join(' | '));
  return { dev: false, sent: false, error: errors.join(' | ') };
}
