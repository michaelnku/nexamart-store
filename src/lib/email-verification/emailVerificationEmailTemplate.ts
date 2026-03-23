type EmailVerificationEmailTemplateProps = {
  verifyUrl: string;
  expiresInMinutes: number;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function EmailVerificationEmailTemplate({
  verifyUrl,
  expiresInMinutes,
}: EmailVerificationEmailTemplateProps): string {
  const safeVerifyUrl = escapeHtml(verifyUrl);

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;background-color:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,sans-serif;color:#0f172a;">
    <div style="padding:32px 16px;">
      <div style="max-width:560px;margin:0 auto;overflow:hidden;border-radius:20px;border:1px solid rgba(148,163,184,0.28);background-color:#ffffff;box-shadow:0 20px 50px rgba(15,23,42,0.08);">
        <div style="padding:28px 32px 24px;border-bottom:1px solid rgba(148,163,184,0.18);background:linear-gradient(135deg, rgba(60,158,224,0.12), rgba(255,255,255,1) 62%);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tbody>
              <tr>
                <td style="width:44px;vertical-align:top;">
                  <div style="height:44px;width:44px;border-radius:12px;background-color:rgba(60,158,224,0.12);text-align:center;line-height:44px;font-size:20px;">✓</div>
                </td>
                <td style="padding-left:12px;vertical-align:top;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#3c9ee0;">NexaMart</div>
                  <div style="margin-top:4px;font-size:12px;color:#64748b;">Secure account setup</div>
                </td>
              </tr>
            </tbody>
          </table>

          <h1 style="margin:20px 0 8px;font-size:28px;line-height:34px;font-weight:600;letter-spacing:-0.02em;color:#0f172a;">Verify your email</h1>
          <p style="margin:0;font-size:14px;line-height:24px;color:#475569;">
            Click the verification link below to activate your NexaMart account and continue onboarding securely.
          </p>
        </div>

        <div style="padding:24px 32px 28px;">
          <div style="border-radius:14px;border:1px solid rgba(60,158,224,0.15);background-color:rgba(60,158,224,0.05);padding:16px;">
            <div style="font-size:14px;font-weight:600;color:#0f172a;">One more step to get started</div>
            <p style="margin:8px 0 0;font-size:14px;line-height:24px;color:#475569;">
              Email verification helps protect buyers, sellers, riders, and staff across the NexaMart marketplace.
            </p>
          </div>

          <div style="padding-top:20px;">
            <div style="font-size:14px;line-height:24px;color:#475569;">• Open this verification link</div>
            <div style="font-size:14px;line-height:24px;color:#475569;">• Confirm your inbox ownership</div>
            <div style="font-size:14px;line-height:24px;color:#475569;">• Return to NexaMart and continue</div>
          </div>

          <div style="padding-top:24px;text-align:center;">
            <a href="${safeVerifyUrl}" style="display:inline-block;height:44px;line-height:44px;padding:0 24px;border-radius:12px;background-color:#3c9ee0;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
              Verify my email
            </a>
          </div>

          <div style="margin-top:20px;border-radius:10px;border:1px solid rgba(148,163,184,0.2);background-color:#f8fafc;padding:12px 14px;">
            <div style="font-size:13px;color:#475569;margin-bottom:6px;">
              If the button does not work, copy and paste this link into your browser:
            </div>
            <div style="font-size:12px;line-height:20px;word-break:break-all;color:#0f172a;">
              ${safeVerifyUrl}
            </div>
          </div>

          <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(148,163,184,0.18);text-align:center;">
            <p style="margin:0;font-size:13px;line-height:22px;color:#64748b;">
              This link expires in ${expiresInMinutes} minutes.
            </p>
            <p style="margin:8px 0 0;font-size:13px;line-height:22px;color:#64748b;">
              If you did not create this account, you can ignore this email.
            </p>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}
