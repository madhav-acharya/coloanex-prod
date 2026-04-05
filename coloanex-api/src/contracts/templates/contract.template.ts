export function generateTermsAndConditions(
  tenantName: string,
  borrowerName: string,
  loanAmount: number,
  interestRate: number,
  termMonths: number,
  rule: any,
): string {
  const penaltyConfig = rule.penaltyConfig;
  const graceDays = penaltyConfig?.gracePeriodDays ?? 7;

  const penaltyClause =
    penaltyConfig?.penaltyType === 'PERCENTAGE'
      ? `${penaltyConfig.penaltyAmount}% of the overdue amount`
      : `NPR ${(penaltyConfig?.penaltyAmount ?? 0).toLocaleString()} (fixed)`;

  return `This Loan Agreement is entered into between ${tenantName} (the "Lender") and ${borrowerName} (the "Borrower"). The Lender agrees to provide a loan of NPR ${loanAmount.toLocaleString()} at an interest rate of ${interestRate}% per month for a term of ${termMonths} months. The Borrower agrees to repay the loan plus accrued interest in equal installments as specified in the payment schedule. Payments received after ${graceDays} days from the due date shall be subject to a late fee of ${penaltyClause} per month until the overdue amount is settled in full. The Borrower covenants to notify the Lender promptly of any event that may affect the ability to repay. The Borrower shall be liable for all reasonable costs and expenses incurred by the Lender in enforcing this Agreement, including legal fees. Prepayment of the outstanding principal is permitted at any time without penalty. This Agreement shall be governed by the applicable laws of the jurisdiction in which the Lender operates. Both parties acknowledge that they have read, understood, and voluntarily agree to be bound by these terms.`;
}

function numberToWords(n: number): string {
  const ones = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];
  if (n < 20) return ones[n];
  if (n < 100)
    return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
  return n.toString();
}

function fmt(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function buildContractHtml(
  tenant: any,
  borrower: any,
  loanAmount: number,
  interestRate: number,
  termMonths: number,
  installmentAmount: number,
  totalInstallments: number,
  totalAmountDue: number,
  startDate: Date,
  endDate: Date,
  rule: any,
  termsAndConditions: string,
  paymentFrequency: string,
  contractNumber: string,
): string {
  const penaltyConfig = rule.penaltyConfig;
  const graceDays = penaltyConfig?.gracePeriodDays ?? 7;
  const penaltyAmount =
    penaltyConfig?.penaltyType === 'PERCENTAGE'
      ? `${penaltyConfig.penaltyAmount}% of the overdue amount`
      : `NPR ${(penaltyConfig?.penaltyAmount ?? 0).toLocaleString()}`;

  const frequencyLabel: Record<string, string> = {
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
  };
  const freqLabel = frequencyLabel[paymentFrequency] ?? 'monthly';
  const periodLabel: Record<string, string> = {
    WEEKLY: 'week',
    MONTHLY: 'month',
    QUARTERLY: 'quarter',
  };
  const periodWord = periodLabel[paymentFrequency] ?? 'month';

  const installmentsInWords =
    numberToWords(totalInstallments) + ' (' + totalInstallments + ')';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Loan Agreement &mdash; ${contractNumber}</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      font-weight: 400;
      line-height: 1.85;
      color: #111;
      background: #fff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 0;
      background: #fff;
    }

    @page {
      margin: 5mm 2mm 10mm 5mm;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 5mm;
      margin-bottom: 2mm;
    }

    .header-left { display: flex; flex-direction: column; gap: 1mm; }

    .lender-name {
      font-size: 13pt;
      font-weight: 700;
      letter-spacing: 0.2px;
      color: #111;
    }

    .lender-sub {
      font-size: 7pt;
      color: #666;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      font-weight: 400;
    }

    .header-right { text-align: right; }

    .header-right img {
      height: 44px;
      width: auto;
      display: block;
      margin-left: auto;
    }

    .contract-ref-box {
      margin-top: 2mm;
      padding: 1.5mm 3.5mm;
      display: inline-block;
      font-size: 7.5pt;
      color: #444;
    }

    .header-divider {
      border: none;
      border-top: 2px solid #111;
      margin-bottom: 7mm;
    }

    h1.doc-title {
      font-size: 17pt;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 3mm;
      color: #111;
    }

    .doc-subtitle {
      text-align: center;
      font-size: 8.5pt;
      color: #555;
      letter-spacing: 0.1px;
      margin-bottom: 8mm;
      font-weight: 400;
    }

    p.body-para {
      text-align: justify;
      margin-bottom: 5mm;
      font-size: 10.5pt;
      font-weight: 400;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    p.body-para.indent {
      text-indent: 7mm;
    }

    .sig-section {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .sig-divider {
      border: none;
      border-top: 2px solid #111;
      margin-top: 10mm;
      margin-bottom: 8mm;
    }

    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16mm;
    }

    .sig-party {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      margin-bottom: 6mm;
      font-weight: 400;
    }

    .sig-line {
      border-bottom: 1.5px solid #333;
      width: 100%;
      height: 10mm;
      margin-bottom: 1.5mm;
    }

    .sig-sublabel {
      font-size: 7.5pt;
      color: #888;
      margin-bottom: 4mm;
      font-weight: 400;
    }

    .sig-name {
      font-size: 11.5pt;
      font-weight: 700;
      color: #111;
      margin-bottom: 1mm;
    }

    .sig-role {
      font-size: 8pt;
      color: #666;
      margin-bottom: 5mm;
      font-weight: 400;
    }

    .sig-date-line {
      border-bottom: 1.5px solid #333;
      width: 55%;
      height: 8mm;
      margin-bottom: 1.5mm;
    }

    .sig-date-label {
      font-size: 7.5pt;
      color: #888;
      font-weight: 400;
    }

    .footer-divider {
      border: none;
      border-top: 1px solid #ddd;
      margin-top: 10mm;
      margin-bottom: 2.5mm;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      font-size: 7pt;
      color: #aaa;
      font-weight: 400;
    }

    @media print {
      body { background: #fff; }
      .page { width: 100%; padding: 14mm 18mm 18mm 18mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-left">
      <div class="lender-name">${tenant.name}</div>
      <div class="lender-sub">Licensed Lending Institution</div>
    </div>
    <div class="header-right">
      ${tenant.logo ? `<img src="${tenant.logo}" alt="${tenant.name}" />` : ''}
      <div class="contract-ref-box">Contract No.: <strong>${contractNumber}</strong></div>
    </div>
  </div>
  <hr class="header-divider" />

  <h1 class="doc-title">Loan Agreement</h1>
  <div class="doc-subtitle">This document constitutes a legally binding agreement between the parties named herein</div>

  <p class="body-para">
    This Loan Agreement ("Agreement") is entered into as of ${fmt(startDate)} by and between <strong>${tenant.name}</strong> ("Lender") and <strong>${borrower.fullName}</strong> ("Borrower"), collectively referred to as the "Parties." The Lender agrees to advance to the Borrower a principal loan amount of NPR ${loanAmount.toLocaleString()} (Nepalese Rupees) on the execution date of ${fmt(startDate)}, at an interest rate of ${interestRate}% per ${periodWord} for a term of ${termMonths} months. The Borrower shall repay the total amount due of NPR ${totalAmountDue.toLocaleString()} in ${installmentsInWords} consecutive ${freqLabel} installments of NPR ${installmentAmount.toLocaleString()} each, commencing on ${fmt(startDate)} and concluding on ${fmt(endDate)}, with each installment due on the first day of each ${periodWord}.
  </p>

  <p class="body-para indent">
    A grace period of ${graceDays} days shall apply after each due date. Any installment not received within this grace period shall attract a late penalty of ${penaltyAmount} per ${periodWord} for each ${periodWord} or part thereof the payment remains overdue, accruing from the first day after the grace period expires. The Borrower is entitled to prepay the outstanding principal balance, in full or in part, at any time prior to the maturity date without incurring any prepayment charge or penalty, and interest shall cease to accrue on any prepaid amount from the date of such prepayment.
  </p>

  <p class="body-para indent">
    The Borrower covenants to use the loan proceeds solely for the stated purpose, to promptly notify the Lender of any circumstances that may impair the ability to repay, and to bear all reasonable costs, legal fees, and collection expenses incurred by the Lender in enforcing this Agreement in the event of default. The Borrower shall be in default if any installment payment is not received within ${graceDays} days of the due date, if the Borrower breaches any representation or warranty herein, or if the Borrower becomes insolvent or is subject to bankruptcy or liquidation proceedings. Upon default, the entire unpaid principal balance, accrued interest, and applicable penalties shall become immediately due and payable at the Lender's election.
  </p>

  <p class="body-para indent">
    The Borrower represents and warrants that all information provided to the Lender is true, accurate, and complete; that the Borrower has full legal capacity to enter into this Agreement; and that the execution of this Agreement does not violate any other obligation or agreement binding upon the Borrower. Each Party agrees to keep the terms of this Agreement strictly confidential and shall not disclose any term hereof to any third party without the prior written consent of the other Party, except as required by applicable law or regulatory authority.
  </p>

  <p class="body-para indent">
    This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Lender is registered. Any dispute arising out of or relating to this Agreement shall first be submitted to good-faith negotiation between the Parties, and failing amicable resolution within thirty days, the dispute shall be referred to the courts of competent jurisdiction. This Agreement constitutes the entire understanding between the Parties and supersedes all prior discussions, representations, and agreements. No modification, waiver, or amendment shall be effective unless made in writing and duly executed by both Parties. If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect to the maximum extent permitted by law.
  </p>

  <p class="body-para" style="font-style: italic; margin-top: 4mm; margin-bottom: 0;">
    IN WITNESS WHEREOF, the Parties have executed this Loan Agreement as of the date first written above, each having had the opportunity to review and understand its terms in full.
  </p>

  <div class="sig-section">
    <hr class="sig-divider" />
    <div class="sig-grid">
      <div>
        <div class="sig-party">Lender</div>
        <div class="sig-line"></div>
        <div class="sig-sublabel">Signature</div>
        <div class="sig-name">${tenant.name}</div>
        <div class="sig-role">Authorized Signatory</div>
       
      </div>
      <div>
        <div class="sig-party">Borrower</div>
        <div class="sig-line"></div>
        <div class="sig-sublabel">Signature</div>
        <div class="sig-name">${borrower.fullName}</div>
        <div class="sig-role">Borrower</div>
       
      </div>
    </div>
  </div>
</div>
</body>
</html>`.trim();
}
