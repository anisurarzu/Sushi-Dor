import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const FALLBACK_FROM = "Sushi D'or <onboarding@resend.dev>";

function client() {
  const key = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function configuredFrom() {
  return process.env.EMAIL_FROM?.trim() || FALLBACK_FROM;
}

function isUnverifiedDomainError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("domain is not verified") ||
    m.includes("only send testing emails to your own email") ||
    m.includes("verify a domain")
  );
}

async function sendOnce(
  resend: Resend,
  from: string,
  input: SendEmailInput,
) {
  return resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

export async function sendEmail(input: SendEmailInput): Promise<{
  ok: boolean;
  skipped?: boolean;
  id?: string;
  error?: string;
}> {
  const resend = client();
  if (!resend) {
    console.info(
      "[email] skipped (no EMAIL_API_KEY):",
      input.subject,
      "→",
      input.to,
    );
    return { ok: true, skipped: true };
  }

  const from = configuredFrom();
  try {
    let result = await sendOnce(resend, from, input);
    if (
      result.error &&
      isUnverifiedDomainError(result.error.message) &&
      !from.includes("onboarding@resend.dev")
    ) {
      console.warn(
        "[email] FROM domain not verified — retrying with onboarding@resend.dev",
      );
      result = await sendOnce(resend, FALLBACK_FROM, input);
    }
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
