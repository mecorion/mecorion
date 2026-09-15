import nodemailer from "nodemailer";
import {config} from "../../core/config.js";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

function createTransport() {
  if (config.MAIL_DEV_MODE || !config.SMTP_HOST) return null;

  return nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: config.SMTP_USER && config.SMTP_PASSWORD
      ? {user: config.SMTP_USER, pass: config.SMTP_PASSWORD}
      : undefined,
  });
}

export async function sendMail(message: MailMessage) {
  const transport = createTransport();
  if (!transport) {
    console.info("[mail:dev]", message);
    return {mode: "dev" as const};
  }

  await transport.sendMail({
    from: config.SMTP_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
  });
  return {mode: "smtp" as const};
}

export async function sendLoginCode(email: string, code: string) {
  return sendMail({
    to: email,
    subject: "Код входа в Mecorion",
    text: `Ваш код входа в Mecorion: ${code}\n\nКод действует 10 минут. Если вы не запрашивали вход, просто проигнорируйте это письмо.`,
  });
}
