export interface RegistrationTemplateData {
  tenantName: string;
  tenantLogo?: string;
  userName: string;
  userEmail: string;
  loginUrl: string;
  supportEmail: string;
  tenantPrimaryColor?: string;
  tenantWebsite?: string;
}

export const registrationTemplate = (
  data: RegistrationTemplateData,
): string => {
  const primaryColor = data.tenantPrimaryColor || '#16A34A';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${data.tenantName}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f5;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: ${primaryColor};
          padding: 40px 20px;
          text-align: center;
        }
        .logo {
          max-width: 150px;
          height: auto;
          margin-bottom: 20px;
        }
        .header-title {
          color: #ffffff;
          font-size: 28px;
          font-weight: 600;
          margin: 0;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          color: #4b5563;
          margin-bottom: 30px;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background-color: ${primaryColor};
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
        }
        .credentials-box {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .credentials-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .credentials-value {
          color: #6b7280;
          font-size: 14px;
          word-break: break-all;
        }
        .footer {
          background-color: #f9fafb;
          padding: 30px 20px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          font-size: 14px;
          color: #6b7280;
          margin: 5px 0;
        }
        .footer-link {
          color: ${primaryColor};
          text-decoration: none;
        }
        .divider {
          border: 0;
          height: 1px;
          background-color: #e5e7eb;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          ${data.tenantLogo ? `<img src="${data.tenantLogo}" alt="${data.tenantName}" class="logo">` : ''}
          <h1 class="header-title">Welcome to ${data.tenantName}</h1>
        </div>
        
        <div class="content">
          <p class="greeting">Hello ${data.userName},</p>
          
          <p class="message">
            Welcome to ${data.tenantName}! Your account has been successfully created. 
            We're excited to have you on board and look forward to serving your financial needs.
          </p>
          
          <div class="credentials-box">
            <div style="margin-bottom: 15px;">
              <div class="credentials-label">Your Email:</div>
              <div class="credentials-value">${data.userEmail}</div>
            </div>
          </div>
          
          <p class="message">
            You can now log in to your account using your email and the password you created during registration.
          </p>
          
          <hr class="divider">
          
          <p class="message" style="font-size: 14px;">
            <strong>Need help getting started?</strong><br>
            If you have any questions or need assistance, please don't hesitate to reach out to our support team at 
            <a href="mailto:${data.supportEmail}" style="color: ${primaryColor};">${data.supportEmail}</a>
          </p>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            © ${new Date().getFullYear()} ${data.tenantName}. All rights reserved.
          </p>
          <p class="footer-text" style="margin-top: 15px;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};
