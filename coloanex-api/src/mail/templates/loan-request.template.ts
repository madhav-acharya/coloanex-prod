export interface LoanRequestTemplateData {
  tenantName: string;
  tenantLogo?: string;
  userName: string;
  status:
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'DISBURSED'
    | 'PENDING_DOCUMENTS';
  loanAmount: string;
  loanType?: string;
  loanPurpose?: string;
  loanId?: string;
  applicationDate: string;
  reviewedDate?: string;
  rejectionReason?: string;
  approvedAmount?: string;
  interestRate?: string;
  tenure?: string;
  disbursementDate?: string;
  dashboardUrl: string;
  supportEmail: string;
  tenantPrimaryColor?: string;
  tenantWebsite?: string;
  requiredDocuments?: string[];
  nextSteps?: string;
}

export const loanRequestTemplate = (data: LoanRequestTemplateData): string => {
  const primaryColor = data.tenantPrimaryColor || '#16A34A';

  const statusConfig = {
    SUBMITTED: {
      color: '#3b82f6',
      bgColor: '#dbeafe',
      title: 'Loan Application Submitted',
      icon: '📝',
      message: `Thank you for submitting your loan application with ${data.tenantName}. We have received your request and will begin processing it shortly.`,
    },
    UNDER_REVIEW: {
      color: '#f59e0b',
      bgColor: '#fef3c7',
      title: 'Loan Application Under Review',
      icon: '🔍',
      message: `Your loan application is currently under review. Our team is carefully evaluating your request and will get back to you soon.`,
    },
    APPROVED: {
      color: '#10b981',
      bgColor: '#d1fae5',
      title: 'Loan Application Approved',
      icon: '✓',
      message: `Great news! Your loan application has been approved. Please review the approved terms below.`,
    },
    REJECTED: {
      color: '#ef4444',
      bgColor: '#fee2e2',
      title: 'Loan Application Status',
      icon: '✗',
      message: `We regret to inform you that your loan application could not be approved at this time.`,
    },
    DISBURSED: {
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      title: 'Loan Disbursed Successfully',
      icon: '💰',
      message: `Congratulations! Your loan has been successfully disbursed. The funds have been transferred to your account.`,
    },
    PENDING_DOCUMENTS: {
      color: '#f59e0b',
      bgColor: '#fef3c7',
      title: 'Additional Documents Required',
      icon: '📄',
      message: `We need additional documents to process your loan application. Please upload the required documents as soon as possible.`,
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
        .loan-details-box {
          background-color: #f9fafb;
          border-left: 4px solid ${config.color};
          border-radius: 6px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        .detail-value {
          color: #6b7280;
          font-size: 14px;
          text-align: right;
          font-weight: 500;
        }
        .highlight-box {
          background: linear-gradient(135deg, ${config.bgColor} 0%, ${config.bgColor}ee 100%);
          border: 2px solid ${config.color};
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
        }
        .highlight-amount {
          font-size: 36px;
          font-weight: 700;
          color: ${config.color};
          margin: 10px 0;
        }
        .highlight-label {
          font-size: 14px;
          color: #4b5563;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
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
        .documents-box {
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .documents-title {
          font-weight: 600;
          color: #92400e;
          font-size: 16px;
          margin-bottom: 15px;
        }
        .document-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .document-item {
          padding: 8px 0;
          color: #78350f;
          font-size: 14px;
          border-bottom: 1px solid #fde68a;
        }
        .document-item:last-child {
          border-bottom: none;
        }
        .document-item:before {
          content: "📎 ";
          margin-right: 8px;
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
          <div class="status-badge">${data.status.replace(/_/g, ' ')}</div>
        </div>
        
        <div class="content" style="padding-top: 0;">
          <p class="greeting">Hello ${data.userName},</p>
          
          <p class="message">${config.message}</p>
          
          ${
            data.status === 'APPROVED' || data.status === 'DISBURSED'
              ? `
          <div class="highlight-box">
            <div class="highlight-label">${data.status === 'DISBURSED' ? 'Disbursed Amount' : 'Approved Amount'}</div>
            <div class="highlight-amount">${data.approvedAmount || data.loanAmount}</div>
          </div>
          `
              : ''
          }
          
          <div class="loan-details-box">
            ${
              data.loanId
                ? `
            <div class="detail-row">
              <span class="detail-label">Application ID:</span>
              <span class="detail-value">${data.loanId}</span>
            </div>
            `
                : ''
            }
            <div class="detail-row">
              <span class="detail-label">Requested Amount:</span>
              <span class="detail-value">${data.loanAmount}</span>
            </div>
            ${
              data.loanType
                ? `
            <div class="detail-row">
              <span class="detail-label">Loan Type:</span>
              <span class="detail-value">${data.loanType}</span>
            </div>
            `
                : ''
            }
            ${
              data.loanPurpose
                ? `
            <div class="detail-row">
              <span class="detail-label">Purpose:</span>
              <span class="detail-value">${data.loanPurpose}</span>
            </div>
            `
                : ''
            }
            <div class="detail-row">
              <span class="detail-label">Application Date:</span>
              <span class="detail-value">${data.applicationDate}</span>
            </div>
            ${
              data.reviewedDate
                ? `
            <div class="detail-row">
              <span class="detail-label">Reviewed Date:</span>
              <span class="detail-value">${data.reviewedDate}</span>
            </div>
            `
                : ''
            }
            ${
              data.interestRate
                ? `
            <div class="detail-row">
              <span class="detail-label">Interest Rate:</span>
              <span class="detail-value">${data.interestRate}</span>
            </div>
            `
                : ''
            }
            ${
              data.tenure
                ? `
            <div class="detail-row">
              <span class="detail-label">Tenure:</span>
              <span class="detail-value">${data.tenure}</span>
            </div>
            `
                : ''
            }
            ${
              data.disbursementDate
                ? `
            <div class="detail-row">
              <span class="detail-label">Disbursement Date:</span>
              <span class="detail-value">${data.disbursementDate}</span>
            </div>
            `
                : ''
            }
            <div class="detail-row">
              <span class="detail-label">Current Status:</span>
              <span class="detail-value" style="color: ${config.color}; font-weight: 600;">${data.status.replace(/_/g, ' ')}</span>
            </div>
          </div>
          
          ${
            data.status === 'REJECTED' && data.rejectionReason
              ? `
          <div class="rejection-box">
            <div class="rejection-title">Reason:</div>
            <div class="rejection-reason">${data.rejectionReason}</div>
          </div>
          `
              : ''
          }
          
          ${
            data.status === 'PENDING_DOCUMENTS' &&
            data.requiredDocuments &&
            data.requiredDocuments.length > 0
              ? `
          <div class="documents-box">
            <div class="documents-title">Required Documents:</div>
            <ul class="document-list">
              ${data.requiredDocuments.map((doc) => `<li class="document-item">${doc}</li>`).join('')}
            </ul>
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
          
          <div class="button-container" style="background-color: ${config.bgColor}; border-radius: 8px; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${config.color};">
              ${
                data.status === 'APPROVED'
                  ? 'Your loan has been approved'
                  : data.status === 'PENDING_DOCUMENTS'
                    ? 'Please upload the required documents'
                    : data.status === 'DISBURSED'
                      ? 'Your loan has been disbursed'
                      : 'Your application is being processed'
              }
            </p>
          </div>
          
          <hr class="divider">
          
          <p class="message" style="font-size: 14px;">
            <strong>Questions or concerns?</strong><br>
            Our support team is here to help. Contact us at 
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
