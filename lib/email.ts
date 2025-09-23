import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  const { data, error } = await resend.emails.send({
    from: 'Biziscan <comms@mail.biziscan.com>',
    to: [to],
    subject: subject,
    html: html,
  });

  if (error) {
    return { error };
  }

  return data;
}

// Email templates
export function generateInvitationEmail(
  organizationName: string,
  inviterName: string,
  inviterEmail: string,
  invitationToken: string,
  baseUrl: string
): string {
  const invitationUrl = `${baseUrl}/invite/${invitationToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Organization Invitation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
          .content { background: white; padding: 30px; border: 1px solid #e9ecef; border-radius: 8px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .button:hover { background: #0056b3; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
          .organization { font-weight: 600; color: #007bff; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 You're Invited!</h1>
          <p>Join <span class="organization">${organizationName}</span> on Biziscan</p>
        </div>
        
        <div class="content">
          <h2>Hello!</h2>
          
          <p><strong>${inviterName}</strong> (${inviterEmail}) has invited you to join <strong>${organizationName}</strong> on Biziscan.</p>
          
          <p>Click the button below to accept your invitation and get started:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" class="button">Accept Invitation</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="background: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 14px;">
            ${invitationUrl}
          </p>
          
          <p><strong>Note:</strong> This invitation will expire in 7 days. If you don't have an account yet, you'll be prompted to create one when you accept the invitation.</p>
        </div>
        
        <div class="footer">
          <p>This invitation was sent to you by ${inviterName} from ${organizationName}.</p>
          <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `;
}
