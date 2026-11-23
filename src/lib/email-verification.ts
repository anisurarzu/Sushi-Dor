import { createHash, randomBytes } from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const TOKEN_HOURS = 48;

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function issueEmailVerificationToken(userId: string) {
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * TOKEN_HOURS);

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return { raw, expiresAt };
}

export async function sendVerificationEmail(
  user: Pick<User, "id" | "email" | "firstName">,
) {
  const { raw } = await issueEmailVerificationToken(user.id);
  const link = `${appUrl()}/compte/verifier?token=${raw}`;
  const name = user.firstName?.trim() || "Bonjour";

  return sendEmail({
    to: user.email,
    subject: `Confirmez votre e-mail · Sushi D'or`,
    html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#0c0a08;color:#f0e6c8;padding:24px">
      <div style="max-width:560px;margin:0 auto;border:1px solid rgba(196,163,90,.35);padding:24px">
        <p style="letter-spacing:.2em;text-transform:uppercase;color:#c4a35a;font-size:12px">Sushi D'or</p>
        <h1 style="font-size:28px;margin:8px 0 16px">${name}, confirmez votre e-mail</h1>
        <p style="color:#c4bbaa;line-height:1.5">
          Merci d’avoir créé votre compte. Cliquez sur le bouton ci-dessous pour
          vérifier votre adresse e-mail. Le lien expire dans ${TOKEN_HOURS}&nbsp;h.
        </p>
        <p style="margin:28px 0">
          <a href="${link}" style="display:inline-block;background:#c4a35a;color:#0c0a08;text-decoration:none;padding:12px 22px;font-weight:600">
            Confirmer mon e-mail
          </a>
        </p>
        <p style="font-size:13px;color:#a89f8e;word-break:break-all">
          Ou copiez ce lien :<br/>${link}
        </p>
      </div>
    </body></html>`,
    text: `${name}, confirmez votre e-mail Sushi D'or : ${link}`,
  });
}

export async function consumeEmailVerificationToken(raw: string) {
  const tokenHash = hashToken(raw.trim());
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!row || row.expiresAt < new Date()) {
    if (row) {
      await prisma.emailVerificationToken.delete({ where: { id: row.id } });
    }
    return { ok: false as const, error: "Lien invalide ou expiré." };
  }

  if (row.user.emailVerifiedAt) {
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: row.userId },
    });
    return { ok: true as const, already: true as const, user: row.user };
  }

  const user = await prisma.user.update({
    where: { id: row.userId },
    data: { emailVerifiedAt: new Date() },
  });
  await prisma.emailVerificationToken.deleteMany({
    where: { userId: row.userId },
  });

  return { ok: true as const, already: false as const, user };
}
