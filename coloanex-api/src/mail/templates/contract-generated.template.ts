export interface ContractGeneratedTemplateData {
  tenantName: string;
  tenantLogo?: string;
  userName: string;
  contractNumber: string;
  loanAmount: string;
  interestRate: string;
  termMonths: number;
  contractPdfUrl?: string;
  signUrl: string;
  generatedDate: string;
  supportEmail: string;
  tenantPrimaryColor?: string;
  tenantWebsite?: string;
}

export const contractGeneratedTemplate = (
  data: ContractGeneratedTemplateData,
): string => {
  const primaryColor = data.tenantPrimaryColor || '#16A34A';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contract Ready to Sign – ${data.tenantName}</title>
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
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      padding: 40px 40px 32px;
      text-align: center;
    }
    .header-logo { height: 48px; margin-bottom: 20px; }
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
    .header-title { color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.3px; }
    .header-subtitle { color: rgba(255,255,255,0.85); font-size: 15px; margin-top: 6px; }
    /* Body */
    .body { padding: 40px; }
    .greeting { font-size: 16px; color: #374151; margin-bottom: 24px; line-height: 1.6; }
    /* Contract card */
    .contract-card {
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 24px;
      margin: 24px 0;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .contract-icon {
      font-size: 40px;
      flex-shrink: 0;
    }
    .contract-info {}
    .contract-number-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .contract-number {
      font-size: 20px;
      font-weight: 800;
      color: #1e40af;
      letter-spacing: 0.5px;
    }
    .contract-date {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
    }
    /* Details */
    .details-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #9ca3af;
      margin-bottom: 14px;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .details-row:last-child { border-bottom: none; }
    .details-row-label { font-size: 14px; color: #6b7280; }
    .details-row-value { font-size: 14px; font-weight: 600; color: #111827; }
    .details-container {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 4px 16px;
      margin-bottom: 28px;
    }
    /* Alert */
    .alert {
      background-color: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 28px;
      font-size: 14px;
      color: #92400e;
      line-height: 1.5;
    }
    /* Buttons */
    .button-group { text-align: center; margin-bottom: 28px; }
    .btn-primary {
      display: inline-block;
      background-color: ${primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      padding: 16px 36px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .btn-secondary {
      display: inline-block;
      background-color: #ffffff;
      color: #374151 !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 12px 28px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      margin-left: 12px;
    }
    /* Footer */
    .footer-divider { height: 1px; background-color: #e5e7eb; margin: 0 40px; }
    .footer { padding: 28px 40px; text-align: center; }
    .footer-text { font-size: 13px; color: #9ca3af; line-height: 1.7; }
    .footer-text a { color: ${primaryColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <!-- Header -->
      <div class="header">
        ${data.tenantLogo ? `<img src="${data.tenantLogo}" alt="${data.tenantName}" class="header-logo" />` : ''}
        <div class="header-icon">📄</div>
        <div class="header-title">Contract Ready to Sign</div>
        <div class="header-subtitle">${data.tenantName} has generated your loan contract</div>
      </div>

      <!-- Body -->
      <div class="body">
        <p class="greeting">
          Hi <strong>${data.userName}</strong>,<br /><br />
          Your loan contract has been prepared by <strong>${data.tenantName}</strong>.
          Please review the contract carefully and sign it to move forward with your loan disbursement.
        </p>

        <!-- Contract info -->
        <div class="contract-card">
          <div class="contract-icon">📋</div>
          <div class="contract-info">
            <div class="contract-number-label">Contract Number</div>
            <div class="contract-number">${data.contractNumber}</div>
            <div class="contract-date">Generated on ${data.generatedDate}</div>
          </div>
        </div>

        <!-- Loan summary -->
        <div class="details-title">Loan Summary</div>
        <div class="details-container">
          <div class="details-row">
            <span class="details-row-label">Loan Amount</span>
            <span class="details-row-value">${data.loanAmount}</span>
          </div>
          <div class="details-row">
            <span class="details-row-label">Interest Rate</span>
            <span class="details-row-value">${data.interestRate}</span>
          </div>
          <div class="details-row">
            <span class="details-row-label">Term</span>
            <span class="details-row-value">${data.termMonths} months</span>
          </div>
        </div>

        <!-- Urgency alert -->
        <div class="alert">
          ⚠️ <strong>Action Required:</strong> Please sign your contract at your earliest convenience.
          Unsigned contracts may be subject to review after an extended period.
        </div>

        <!-- Action buttons -->
        <div class="button-group">
          <a href="${data.signUrl}" class="btn-primary">Sign Contract Now</a>
          ${data.contractPdfUrl ? `<a href="${data.contractPdfUrl}" class="btn-secondary">View PDF</a>` : ''}
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
