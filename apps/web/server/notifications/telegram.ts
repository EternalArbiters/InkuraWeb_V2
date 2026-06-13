import "server-only";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

function formatIDR(amount: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function sendInkuraDonationNotification(data: {
  donorName: string;
  amount: number;
  currency: string;
  message?: string | null;
  proofImageBase64?: string | null;
  proofImageMimeType?: string | null;
}) {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const amountStr = formatIDR(data.amount, data.currency);

  const text = [
    `💜 *Donasi ke Inkura!*`,
    ``,
    `*Dari:* ${data.donorName}`,
    `*Jumlah:* ${amountStr}`,
    data.message ? `*Pesan:* _${data.message}_` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const base = `https://api.telegram.org/bot${BOT_TOKEN}`;

  try {
    if (data.proofImageBase64) {
      const buffer = Buffer.from(data.proofImageBase64, "base64");
      const mimeType = data.proofImageMimeType || "image/jpeg";
      const ext = mimeType.split("/")[1] || "jpg";

      const form = new FormData();
      form.append("chat_id", CHAT_ID);
      form.append("caption", text);
      form.append("parse_mode", "Markdown");
      form.append("photo", new Blob([buffer], { type: mimeType }), `proof.${ext}`);

      await fetch(`${base}/sendPhoto`, { method: "POST", body: form });
    } else {
      await fetch(`${base}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" }),
      });
    }
  } catch {
    // Non-fatal
  }
}

export async function sendDonationNotification(data: {
  donorName: string;
  recipientName: string;
  recipientUsername: string | null;
  amount: number;
  currency: string;
  message?: string | null;
  proofImageBase64?: string | null;
  proofImageMimeType?: string | null;
  donationId: string;
}) {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const amountStr = formatIDR(data.amount, data.currency);
  const recipient = data.recipientUsername
    ? `${data.recipientName} (@${data.recipientUsername})`
    : data.recipientName;

  const text = [
    `🎁 *Donasi Baru!*`,
    ``,
    `*Untuk:* ${recipient}`,
    `*Dari:* ${data.donorName}`,
    `*Jumlah:* ${amountStr}`,
    data.message ? `*Pesan:* _${data.message}_` : null,
    ``,
    `[Lihat di dashboard](${process.env.NEXTAUTH_URL || "https://inkura.id"}/admin/donations)`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const base = `https://api.telegram.org/bot${BOT_TOKEN}`;

  try {
    if (data.proofImageBase64) {
      const buffer = Buffer.from(data.proofImageBase64, "base64");
      const mimeType = data.proofImageMimeType || "image/jpeg";
      const ext = mimeType.split("/")[1] || "jpg";

      const form = new FormData();
      form.append("chat_id", CHAT_ID);
      form.append("caption", text);
      form.append("parse_mode", "Markdown");
      form.append("photo", new Blob([buffer], { type: mimeType }), `proof.${ext}`);

      await fetch(`${base}/sendPhoto`, { method: "POST", body: form });
    } else {
      await fetch(`${base}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" }),
      });
    }
  } catch {
    // Non-fatal
  }
}
