export interface LoanApprovalTemplateData {
  tenantName: string;
  tenantLogo?: string;
  userName: string;
  approvedAmount: string;
  requestedAmount: string;
  interestRate: string;
  termMonths: number;
  loanPurpose?: string;
  loanId: string;
  approvalDate: string;
  contractUrl: string;
  supportEmail: string;
  tenantPrimaryColor?: string;
  tenantWebsite?: string;
}

export const loanApprovalTemplate = (
  data: LoanApprovalTemplateData,
): string => {
  const primaryColor = data.tenantPrimaryColor || '#16A34A';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Loan Approved – ${data.tenantName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper { width: 100%; background-color: #f3f4f6; padding: 40px 20px; }
    .card {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    /* Header */
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%);
      padding: 40px 40px 32px;
      text-align: center;
    }
    .header-logo {
      height: 48px;
      margin-bottom: 20px;
    }
    .header-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background-color: rgba(255,255,255,0.2);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin-bottom: 16px;
    }
    .header-title {
      color: #ffffff;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .header-subtitle {
      color: rgba(255,255,255,0.85);
      font-size: 15px;
      margin-top: 6px;
    }
    /* Body */
    .body { padding: 40px; }
    .greeting {
      font-size: 16px;
      color: #374151;
      margin-bottom: 20px;
      line-height: 1.6;
    }
    /* Amount hero */
    .amount-hero {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 28px;
      text-align: center;
      margin: 24px 0;
    }
    .amount-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .amount-value {
      font-size: 42px;
      font-weight: 800;
      color: #15803d;
      letter-spacing: -1px;
    }
    .amount-note {
      font-size: 13px;
      color: #6b7280;
      margin-top: 8px;
    }
    /* Details grid */
    .details-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #9ca3af;
      margin-bottom: 14px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 28px;
    }
    .detail-card {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .detail-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }
    /* CTA */
    .cta-section { text-align: center; margin: 32px 0; }
    .cta-button {
      display: inline-block;
      background-color: ${primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      padding: 16px 40px;
      border-radius: 8px;
      letter-spacing: 0.2px;
    }
    .cta-note {
      font-size: 13px;
      color: #9ca3af;
      margin-top: 12px;
    }
    /* Next steps */
    .next-steps {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .next-steps-title {
      font-size: 14px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 10px;
    }
    .next-steps ol {
      padding-left: 18px;
    }
    .next-steps li {
      font-size: 14px;
      color: #78350f;
      margin-bottom: 6px;
      line-height: 1.5;
    }
    /* Footer */
    .footer-divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 0 40px;
    }
    .footer {
      padding: 28px 40px;
      text-align: center;
    }
    .footer-text {
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.7;
    }
    .footer-text a {
      color: ${primaryColor};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <!-- Header -->
      <div class="header">
        ${data.tenantLogo ? `<img src="${data.tenantLogo}" alt="${data.tenantName}" class="header-logo" />` : ''}
        <div class="header-icon">🎉</div>
        <div class="header-title">Loan Approved!</div>
        <div class="header-subtitle">Congratulations, your application has been approved</div>
      </div>

      <!-- Body -->
      <div class="body">
        <p class="greeting">
          Hi <strong>${data.userName}</strong>,<br /><br />
          We are excited to let you know that your loan application with <strong>${data.tenantName}</strong>
          has been reviewed and <strong>approved</strong>. Your contract is now ready for you to review and sign.
        </p>

        <!-- Approved amount hero -->
        <div class="amount-hero">
          <div class="amount-label">Approved Amount</div>
          <div class="amount-value">${data.approvedAmount}</div>
          ${data.requestedAmount !== data.approvedAmount ? `<div class="amount-note">Requested: ${data.requestedAmount}</div>` : ''}
        </div>

        <!-- Loan details -->
        <div class="details-title">Loan Details</div>
        <div class="details-grid">
          <div class="detail-card">
            <div class="detail-label">Interest Rate</div>
            <div class="detail-value">${data.interestRate}</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Term</div>
            <div class="detail-value">${data.termMonths} months</div>
          </div>
          <div class="detail-card">
            <div class="detail-label">Approval Date</div>
            <div class="detail-value">${data.approvalDate}</div>
          </div>
          ${
            data.loanPurpose
              ? `
          <div class="detail-card">
            <div class="detail-label">Purpose</div>
            <div class="detail-value">${data.loanPurpose}</div>
          </div>`
              : ''
          }
        </div>

        <!-- Next steps -->
        <div class="next-steps">
          <div class="next-steps-title">📋 Next Steps</div>
          <ol>
            <li>Review your contract details carefully.</li>
            <li>Sign the contract electronically to confirm your acceptance.</li>
            <li>Once signed, funds will be disbursed according to the agreed schedule.</li>
          </ol>
        </div>

        <!-- CTA -->
        <div class="cta-section">
          <a href="${data.contractUrl}" class="cta-button">View & Sign Your Contract</a>
          <div class="cta-note">Your contract awaits your signature. Please sign at your earliest convenience.</div>
        </div>
      </div>

      <div class="footer-divider"></div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">
          This email was sent by <strong>${data.tenantName}</strong>.<br />
          Questions? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.<br />
          ${data.tenantWebsite ? `<a href="${data.tenantWebsite}">${data.tenantWebsite}</a>` : ''}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
};
