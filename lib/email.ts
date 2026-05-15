function getEmailBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function getBrandName() {
  return process.env.NEXT_PUBLIC_SITE_NAME?.trim() || process.env.NEWSLETTER_FROM_NAME?.trim() || "Your Brand";
}

export function buildPasswordResetLink(token: string) {
  const baseUrl = getEmailBaseUrl() || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/account/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name?: string;
  resetLink: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const brandName = getBrandName();

  if (!resendApiKey || !fromEmail) {
    return { sent: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.email],
      subject: `Reset your ${brandName} password`,
      text: `Hi${input.name ? ` ${input.name}` : ""},\n\nUse the link below to reset your ${brandName} account password. This link will expire in 1 hour.\n\n${input.resetLink}\n\nIf you didn't request this, you can ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="margin:0;padding:0;background-color:#f4f4f4;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f4;margin:0;padding:24px 0;width:100%;">
              <tr>
                <td align="center" style="padding:0 16px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border:1px solid #d9d9d9;width:100%;">
                    <tr>
                      <td style="padding:32px 32px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;letter-spacing:2px;text-transform:uppercase;color:#666666;">
                        ${brandName}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 32px 8px;font-family:Arial,Helvetica,sans-serif;font-size:30px;line-height:36px;font-weight:700;color:#000000;">
                        Reset your password
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#333333;">
                        Hi${input.name ? ` ${input.name}` : ""},
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#333333;">
                        Use the button below to reset your ${brandName} account password. This link will expire in 1 hour.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:28px 32px 8px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td bgcolor="#000000" style="background-color:#000000;">
                              <a href="${input.resetLink}" style="display:inline-block;padding:14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#555555;">
                        If the button does not work, copy and paste this link into your browser:
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;word-break:break-all;">
                        <a href="${input.resetLink}" style="color:#111111;text-decoration:underline;">${input.resetLink}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 32px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#555555;">
                        If you didn&apos;t request this, you can ignore this email.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Could not send reset email: ${errorText}`);
  }

  return { sent: true };
}
