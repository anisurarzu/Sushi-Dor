import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function client() {
  const key = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendEmail(input: SendEmailInput): Promise<{
  ok: boolean;
  skipped?: boolean;
  id?: string;
  error?: string;
}> {
  const resend = client();
  const from = process.env.EMAIL_FROM || "Sushi D'or <noreply@sushidor.fr>";
  if (!resend) {
    console.info("[email] skipped (no EMAIL_API_KEY):", input.subject, "→", input.to);
    return { ok: true, skipped: true };
  }
  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (result.error) {
      console.error("[email] send failed", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email error";
    console.error("[email] send exception", message);
    return { ok: false, error: message };
  }
}
