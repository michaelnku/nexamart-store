import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}) {
  return resend.emails.send({
    from: from ?? process.env.EMAIL_FROM!,
    to,
    subject,
    html,
    replyTo,
  });
}
