export interface TenantCreationTemplateData {
  tenantName: string;
  tenantLogo?: string;
  ownerName: string;
  ownerEmail: string;
  tenantId: string;
  dashboardUrl: string;
  supportEmail: string;
  tenantPrimaryColor?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  features?: string[];
}

export const tenantCreationTemplate = (
  data: TenantCreationTemplateData,
): string => {
  const primaryColor = data.tenantPrimaryColor || '#16A34A';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tenant Created Successfully - ${data.tenantName}</title>
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
          background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);
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
        .header-subtitle {
          color: #ffffffcc;
          font-size: 16px;
          margin-top: 10px;
        }
        .success-icon {
          font-size: 64px;
          margin: 30px 0;
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
          margin-bottom: 20px;
        }
        .tenant-info-box {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-left: 4px solid ${primaryColor};
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
        }
        .tenant-name {
          font-size: 24px;
          font-weight: 700;
          color: ${primaryColor};
          margin-bottom: 15px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #bfdbfe;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #1e40af;
          font-size: 14px;
        }
        .info-value {
          color: #1e3a8a;
          font-size: 14px;
          text-align: right;
          word-break: break-all;
        }
        .features-box {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .features-title {
          font-weight: 600;
          color: #374151;
          font-size: 16px;
          margin-bottom: 15px;
        }
        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .feature-item {
          padding: 10px 0;
          color: #4b5563;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
        }
        .feature-item:last-child {
          border-bottom: none;
        }
        .feature-item:before {
          content: "✓ ";
          color: ${primaryColor};
          font-weight: bold;
          margin-right: 10px;
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
        .alert-box {
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .alert-title {
          font-weight: 600;
          color: #92400e;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .alert-text {
          color: #78350f;
          font-size: 14px;
          line-height: 1.6;
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
          <h1 class="header-title">Tenant Created Successfully</h1>
          <p class="header-subtitle">Your organization is now ready to use CoLoanEx</p>
        </div>
        
        <div class="content" style="text-align: center;">
          <div class="success-icon">🎉</div>
        </div>
        
        <div class="content" style="padding-top: 0;">
          <p class="greeting">Hello ${data.ownerName},</p>
          
          <p class="message">
            Congratulations! Your tenant organization has been successfully created on CoLoanEx. 
            You can now start managing loans, borrowers, and all financial operations through your dedicated dashboard.
          </p>
          
          <div class="tenant-info-box">
            <div class="tenant-name">${data.tenantName}</div>
            <div class="info-row">
              <span class="info-label">Tenant ID:</span>
              <span class="info-value">${data.tenantId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Owner Email:</span>
              <span class="info-value">${data.ownerEmail}</span>
            </div>
            ${
              data.contactEmail
                ? `
            <div class="info-row">
              <span class="info-label">Contact Email:</span>
              <span class="info-value">${data.contactEmail}</span>
            </div>
            `
                : ''
            }
            ${
              data.contactPhone
                ? `
            <div class="info-row">
              <span class="info-label">Contact Phone:</span>
              <span class="info-value">${data.contactPhone}</span>
            </div>
            `
                : ''
            }
            ${
              data.address
                ? `
            <div class="info-row">
              <span class="info-label">Address:</span>
              <span class="info-value">${data.address}</span>
            </div>
            `
                : ''
            }
          </div>
          
          ${
            data.features && data.features.length > 0
              ? `
          <div class="features-box">
            <div class="features-title">Available Features:</div>
            <ul class="feature-list">
              ${data.features.map((feature) => `<li class="feature-item">${feature}</li>`).join('')}
            </ul>
          </div>
          `
              : ''
          }
          
          <div class="alert-box">
            <div class="alert-title">Next Steps:</div>
            <div class="alert-text">
              1. Log in to your dashboard using your credentials<br>
              2. Complete your organization profile and branding<br>
              3. Configure mail settings for email notifications<br>
              4. Add team members and assign roles<br>
              5. Start creating loan products and managing borrowers
            </div>
          </div>
          
          <div class="button-container" style="background-color: #d1fae5; border-radius: 8px; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #16a34a;">
              Your tenant organization is now ready to use
            </p>
          </div>
          
          <hr class="divider">
          
          <p class="message" style="font-size: 14px;">
            <strong>Need help getting started?</strong><br>
            Our support team is here to assist you with onboarding and setup. 
            Contact us at <a href="mailto:${data.supportEmail}" style="color: ${primaryColor};">${data.supportEmail}</a>
          </p>
          
          <p class="message" style="font-size: 14px; color: #6b7280;">
            <strong>Important:</strong> Please keep your tenant ID secure. You may need it for API integrations and support requests.
          </p>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            © ${new Date().getFullYear()} CoLoanEx. All rights reserved.
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
