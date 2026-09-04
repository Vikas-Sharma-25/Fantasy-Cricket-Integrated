import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'vikass78901@gmail.com',
          pass: 'lwvrqtwrvxczfnvh'
        },
        tls: { rejectUnauthorized: false }
      });
      await transporter.verify();
      return res.status(200).json({ success: true, message: 'SMTP verified on Vercel!' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { to, subject, html, text, secret } = req.body || {};
    if (secret !== 'cricket_otp_2026') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'vikass78901@gmail.com',
          pass: 'lwvrqtwrvxczfnvh'
        },
        tls: { rejectUnauthorized: false }
      });

      const info = await transporter.sendMail({
        from: '"Fantasy Cricket Arena" <vikass78901@gmail.com>',
        to,
        subject,
        html,
        text
      });

      return res.status(200).json({ success: true, messageId: info.messageId });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
