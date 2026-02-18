import "server-only";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

async function sendEmail(params: SendEmailParams) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!key || !from) return { ok: false as const, skipped: true as const };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    return { ok: false as const, error: `Resend error: ${res.status} ${msg}` };
  }

  return { ok: true as const };
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }) {
  const subject = "Reset password Inkura";
  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.5">
      <h2>Reset password</h2>
      <p>Kamu minta reset password Inkura. Klik tombol di bawah untuk set password baru.</p>
      <p style="margin:16px 0">
        <a href="${params.resetUrl}" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;border-radius:8px;text-decoration:none">
          Reset password
        </a>
      </p>
      <p>Kalau kamu tidak merasa meminta reset password, abaikan email ini.</p>
    </div>
  `.trim();
  return sendEmail({ to: params.to, subject, html });
}
