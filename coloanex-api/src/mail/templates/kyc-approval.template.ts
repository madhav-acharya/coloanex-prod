export interface KycApprovalTemplateData {
  tenantName: string;
  tenantLogo?: string;
  userName: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'UNDER_REVIEW';
  rejectionReason?: string;
  documentName?: string;
  submittedDate: string;
  reviewedDate?: string;
  dashboardUrl: string;
  supportEmail: string;
  tenantPrimaryColor?: string;
  tenantWebsite?: string;
  nextSteps?: string;
}

export const kycApprovalTemplate = (data: KycApprovalTemplateData): string => {
  const primaryColor = data.tenantPrimaryColor || '#4F46E5';

  const statusConfig = {
    APPROVED: {
      color: '#10b981',
      bgColor: '#d1fae5',
      title: 'KYC Verification Approved',
      icon: '✓',
      message: `Congratulations! Your KYC verification has been approved. You now have full access to all features and services on ${data.tenantName}.`,
    },
    REJECTED: {
      color: '#ef4444',
      bgColor: '#fee2e2',
      title: 'KYC Verification Rejected',
      icon: '✗',
      message: `Unfortunately, your KYC verification has been rejected. Please review the reason below and resubmit your documents.`,
    },
    PENDING: {
      color: '#f59e0b',
      bgColor: '#fef3c7',
      title: 'KYC Verification Pending',
      icon: '⏳',
      message: `Your KYC verification is currently pending review. We will notify you once the review is complete.`,
    },
    UNDER_REVIEW: {
      color: '#3b82f6',
      bgColor: '#dbeafe',
      title: 'KYC Verification Under Review',
      icon: '🔍',
      message: `Your KYC documents are currently under review. Our team is carefully verifying your information.`,
    },
  };

  const config = statusConfig[data.status];

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.title} - ${data.tenantName}</title>
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
        .status-badge {
          display: inline-block;
          padding: 10px 20px;
          background-color: ${config.bgColor};
          color: ${config.color};
          border-radius: 20px;
          font-weight: 600;
          font-size: 18px;
          margin: 20px 0;
        }
        .status-icon {
          font-size: 48px;
          margin: 20px 0;
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
        .info-box {
          background-color: #f9fafb;
          border-left: 4px solid ${config.color};
          border-radius: 6px;
          padding: 20px;
          margin: 20px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        .info-value {
          color: #6b7280;
          font-size: 14px;
          text-align: right;
        }
        .rejection-box {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .rejection-title {
          font-weight: 600;
          color: #991b1b;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .rejection-reason {
          color: #7f1d1d;
          font-size: 14px;
          line-height: 1.6;
        }
        .next-steps-box {
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .next-steps-title {
          font-weight: 600;
          color: #1e40af;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .next-steps-text {
          color: #1e3a8a;
          font-size: 14px;
          line-height: 1.6;
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
          <h1 class="header-title">${data.tenantName}</h1>
        </div>
        
        <div class="content" style="text-align: center;">
          <div class="status-icon">${config.icon}</div>
          <div class="status-badge">${data.status.replace('_', ' ')}</div>
        </div>
        
        <div class="content" style="padding-top: 0;">
          <p class="greeting">Hello ${data.userName},</p>
          
          <p class="message">${config.message}</p>
          
          <div class="info-box">
            ${
              data.documentName
                ? `
            <div class="info-row">
              <span class="info-label">Document:</span>
              <span class="info-value">${data.documentName}</span>
            </div>
            `
                : ''
            }
            <div class="info-row">
              <span class="info-label">Submitted:</span>
              <span class="info-value">${data.submittedDate}</span>
            </div>
            ${
              data.reviewedDate
                ? `
            <div class="info-row">
              <span class="info-label">Reviewed:</span>
              <span class="info-value">${data.reviewedDate}</span>
            </div>
            `
                : ''
            }
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value" style="color: ${config.color}; font-weight: 600;">${data.status.replace('_', ' ')}</span>
            </div>
          </div>
          
          ${
            data.status === 'REJECTED' && data.rejectionReason
              ? `
          <div class="rejection-box">
            <div class="rejection-title">Reason for Rejection:</div>
            <div class="rejection-reason">${data.rejectionReason}</div>
          </div>
          `
              : ''
          }
          
          ${
            data.nextSteps
              ? `
          <div class="next-steps-box">
            <div class="next-steps-title">Next Steps:</div>
            <div class="next-steps-text">${data.nextSteps}</div>
          </div>
          `
              : ''
          }
          
          <div class="button-container">
            <a href="${data.dashboardUrl}" class="button">
              ${data.status === 'APPROVED' ? 'Go to Dashboard' : data.status === 'REJECTED' ? 'Resubmit Documents' : 'View Status'}
            </a>
          </div>
          
          <hr class="divider">
          
          <p class="message" style="font-size: 14px;">
            <strong>Need assistance?</strong><br>
            If you have any questions or concerns, please contact our support team at 
            <a href="mailto:${data.supportEmail}" style="color: ${primaryColor};">${data.supportEmail}</a>
          </p>
        </div>
        
        <div class="footer">
          <p class="footer-text">
            © ${new Date().getFullYear()} ${data.tenantName}. All rights reserved.
          </p>
          ${
            data.tenantWebsite
              ? `
          <p class="footer-text">
            <a href="${data.tenantWebsite}" class="footer-link">${data.tenantWebsite}</a>
          </p>
          `
              : ''
          }
          <p class="footer-text" style="margin-top: 15px;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};
