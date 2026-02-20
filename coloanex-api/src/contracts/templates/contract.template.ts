export function generateTermsAndConditions(
  tenantName: string,
  borrowerName: string,
  loanAmount: number,
  interestRate: number,
  termMonths: number,
  rule: any,
): string {
  const penaltyConfig = rule.penaltyConfig as any;
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
  const penaltyConfig = rule.penaltyConfig as any;
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
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.8;
      color: #111;
      background: #fff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 22mm 24mm 28mm 24mm;
      background: #fff;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #111;
      padding-bottom: 6mm;
      margin-bottom: 7mm;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 1mm;
    }

    .lender-name {
      font-size: 15pt;
      font-weight: bold;
      letter-spacing: 0.3px;
      font-family: "Helvetica Neue", Arial, sans-serif;
    }

    .lender-sub {
      font-size: 8.5pt;
      color: #555;
      font-family: "Helvetica Neue", Arial, sans-serif;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .header-right {
      text-align: right;
    }

    .header-right img {
      height: 52px;
      width: auto;
      display: block;
      margin-left: auto;
    }

    .contract-ref-box {
      margin-top: 2mm;
      border: 1px solid #bbb;
      padding: 2mm 4mm;
      display: inline-block;
      font-size: 8.5pt;
      font-family: "Helvetica Neue", Arial, sans-serif;
      color: #333;
    }

    h1.doc-title {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 17pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 3mm;
    }

    .doc-subtitle {
      text-align: center;
      font-size: 9pt;
      color: #555;
      font-family: "Helvetica Neue", Arial, sans-serif;
      letter-spacing: 0.3px;
      margin-bottom: 7mm;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 7mm;
      font-size: 10pt;
    }

    .summary-table th,
    .summary-table td {
      border: 1px solid #ccc;
      padding: 2.5mm 4mm;
      vertical-align: top;
    }

    .summary-table th {
      background: #f3f3f3;
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #333;
      font-weight: 600;
      text-align: left;
    }

    .summary-table td {
      color: #111;
    }

    .parties-para {
      text-align: justify;
      margin-bottom: 5mm;
    }

    .whereas-block {
      background: #f9f9f9;
      border-left: 3px solid #444;
      padding: 3mm 5mm;
      margin-bottom: 6mm;
      font-style: italic;
      font-size: 10.5pt;
      text-align: justify;
    }

    h2.section-title {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 5mm;
      margin-bottom: 1.5mm;
      color: #111;
    }

    ol.clauses {
      list-style: none;
      counter-reset: clause-counter;
      padding: 0;
      margin-bottom: 5mm;
    }

    ol.clauses li {
      counter-increment: clause-counter;
      display: flex;
      gap: 3mm;
      text-align: justify;
      margin-bottom: 4mm;
    }

    ol.clauses li::before {
      content: counter(clause-counter) ".";
      font-weight: bold;
      font-family: "Helvetica Neue", Arial, sans-serif;
      min-width: 6mm;
      flex-shrink: 0;
      padding-top: 0.3mm;
    }

    ol.clauses li .clause-body {
      flex: 1;
    }

    ol.clauses li .clause-body strong {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      letter-spacing: 0.2px;
    }

    ol.clauses li .clause-body p {
      margin-top: 2mm;
      text-align: justify;
    }

    u { text-decoration: underline; }

    .acknowledgement {
      margin-top: 4mm;
      margin-bottom: 8mm;
      text-align: justify;
      font-style: italic;
    }

    .sig-section {
      page-break-inside: avoid;
      margin-top: 10mm;
    }

    .sig-section-title {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: bold;
      color: #555;
      border-top: 1px solid #ccc;
      padding-top: 3mm;
      margin-bottom: 6mm;
    }

    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18mm;
    }

    .sig-block {}

    .sig-label {
      font-family: "Helvetica Neue", Arial, sans-serif;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #555;
      margin-bottom: 1mm;
    }

    .sig-name {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 1mm;
    }

    .sig-role {
      font-size: 9pt;
      color: #555;
      margin-bottom: 6mm;
    }

    .sig-line-wrap {
      border-bottom: 1px solid #111;
      margin-bottom: 2mm;
      min-height: 10mm;
    }

    .sig-date-line {
      font-size: 9pt;
      color: #555;
    }

    .footer {
      margin-top: 14mm;
      border-top: 1px solid #ccc;
      padding-top: 3mm;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #888;
      font-family: "Helvetica Neue", Arial, sans-serif;
    }

    @media print {
      body { background: #fff; }
      .page { width: 100%; padding: 15mm 20mm 22mm 20mm; }
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

  <h1 class="doc-title">Loan Agreement</h1>
  <div class="doc-subtitle">This document constitutes a legally binding agreement between the parties named herein</div>

  <table class="summary-table">
    <tbody>
      <tr>
        <th>Lender</th>
        <td>${tenant.name}</td>
        <th>Borrower</th>
        <td>${borrower.fullName}</td>
      </tr>
      <tr>
        <th>Loan Amount</th>
        <td>NPR ${loanAmount.toLocaleString()}</td>
        <th>Interest Rate</th>
        <td>${interestRate}% per month</td>
      </tr>
      <tr>
        <th>Term</th>
        <td>${termMonths} months</td>
        <th>Payment Frequency</th>
        <td style="text-transform: capitalize;">${freqLabel}</td>
      </tr>
      <tr>
        <th>Installment Amount</th>
        <td>NPR ${installmentAmount.toLocaleString()}</td>
        <th>Total Installments</th>
        <td>${totalInstallments}</td>
      </tr>
      <tr>
        <th>Start Date</th>
        <td>${fmt(startDate)}</td>
        <th>End Date</th>
        <td>${fmt(endDate)}</td>
      </tr>
      <tr>
        <th>Total Amount Due</th>
        <td><strong>NPR ${totalAmountDue.toLocaleString()}</strong></td>
        <th>Late Fee Grace Period</th>
        <td>${graceDays} days</td>
      </tr>
    </tbody>
  </table>

  <p class="parties-para">
    This Loan Agreement (&ldquo;Agreement&rdquo;) is entered into as of <u>${fmt(startDate)}</u> by and between <strong>${tenant.name}</strong> (&ldquo;Lender&rdquo;) and <strong>${borrower.fullName}</strong> (&ldquo;Borrower&rdquo;), collectively referred to as the &ldquo;Parties.&rdquo;
  </p>

  <div class="whereas-block">
    WHEREAS, the Lender agrees to extend credit in the form of a personal loan to the Borrower, and the Borrower agrees to accept such credit and repay it under the terms and conditions set forth below.
  </div>

  <h2 class="section-title">Terms and Conditions</h2>

  <ol class="clauses">

    <li>
      <div class="clause-body">
        <strong>LOAN AMOUNT.</strong> The Lender agrees to provide a principal loan amount of <u>NPR ${loanAmount.toLocaleString()} (Nepalese Rupees)</u> to the Borrower on the Execution Date of <u>${fmt(startDate)}</u>, subject to the terms herein.
      </div>
    </li>

    <li>
      <div class="clause-body">
        <strong>INTEREST RATE AND REPAYMENT.</strong> The outstanding principal shall accrue interest at the rate of <u>${interestRate}% per month</u>. The Borrower shall repay the total amount due of <u>NPR ${totalAmountDue.toLocaleString()}</u> in <u>${installmentsInWords} consecutive ${freqLabel} installments</u> of <u>NPR ${installmentAmount.toLocaleString()}</u> each, commencing on <u>${fmt(startDate)}</u> and concluding on <u>${fmt(endDate)}</u>. Each installment is due on the first day of each ${periodWord}.
      </div>
    </li>

    <li>
      <div class="clause-body">
        <strong>LATE PAYMENT AND PENALTY.</strong> A grace period of <u>${graceDays} days</u> shall apply after each due date. Any installment not received within this grace period shall attract a late penalty of <u>${penaltyAmount}</u> per ${periodWord} for each ${periodWord} or part thereof the payment remains overdue, accruing from the first day after the grace period expires.
      </div>
    </li>

    <li>
      <div class="clause-body">
        <strong>PREPAYMENT.</strong> The Borrower is entitled to prepay the outstanding principal balance, in full or in part, at any time prior to the maturity date without incurring any prepayment charge or penalty. Interest shall cease to accrue on any prepaid amount from the date of prepayment.
      </div>
    </li>

    <li>
      <div class="clause-body">
        <strong>COVENANTS OF THE BORROWER.</strong> The Borrower shall: (a) use the loan proceeds for the stated purpose; (b) promptly notify the Lender of any circumstances that may impair the ability to repay; and (c) bear all reasonable costs, legal fees, and collection expenses incurred by the Lender in enforcing this Agreement in the event of default.
      </div>
    </li>

    <li>
      <div class="clause-body">
        <strong>EVENTS OF DEFAULT.</strong> The Borrower shall be in default if: (a) any installment payment is not received within <u>${graceDays} days</u> of the due date; (b) the Borrower breaches any representation, warranty, or covenant herein; or (c) the Borrower becomes insolvent, makes a general assignment for the benefit of creditors, or is subject to bankruptcy or liquidation proceedings. Upon default, the entire unpaid principal balance, accrued interest, and applicable penalties shall become immediately due and payable at the Lender&rsquo;s election.
      </div>
    </li>

    <li>
      <div class="clause-body">
        <strong>REPRESENTATIONS AND WARRANTIES.</strong> The Borrower represents and warrants that: (a) all information provided to the Lender is true, accurate, and complete; (b) the Borrower has full legal capacity to enter into this Agreement; (c) the execution of this Agreement does not violate any other obligation or agreement binding upon the Borrower.
      </div>
    </li>

    <li>
      <div class="clause-body">
        <strong>CONFIDENTIALITY.</strong> Each Party agrees to keep the terms of this Agreement strictly confidential and shall not disclose or permit the disclosure of any term hereof to any third party without the prior written consent of the other Party, except as required by applicable law or regulatory authority.
      </div>
    </li>

    <li>
      <div class="clause-body">
        <strong>GOVERNING LAW AND DISPUTE RESOLUTION.</strong> This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Lender is registered. Any dispute arising out of or relating to this Agreement shall first be submitted to good-faith negotiation between the Parties. Failing amicable resolution within thirty (30) days, the dispute shall be referred to the courts of competent jurisdiction.
      </div>
    </li>

    <li>
      <div class="clause-body">
        <strong>ENTIRE AGREEMENT AND AMENDMENTS.</strong> This Agreement constitutes the entire understanding between the Parties with respect to the subject matter hereof and supersedes all prior discussions, representations, and agreements. No modification, waiver, or amendment of any provision of this Agreement shall be effective unless made in writing and duly executed by both Parties.
      </div>
    </li>

    <li>
      <div class="clause-body">
        <strong>SEVERABILITY.</strong> If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect to the maximum extent permitted by law.
      </div>
    </li>

  </ol>

  <p class="acknowledgement">
    IN WITNESS WHEREOF, the Parties have executed this Loan Agreement as of the date first written above, each having had the opportunity to review and understand its terms in full.
  </p>

  <div class="sig-section">
    <div class="sig-section-title">Signatures</div>
    <div class="sig-grid">
      <div class="sig-block">
        <div class="sig-label">Lender</div>
        <div class="sig-name">${tenant.name}</div>
        <div class="sig-role">Authorized Signatory</div>
        <div class="sig-line-wrap">&nbsp;</div>
        <div class="sig-date-line">Signature &amp; Date: ___________________________</div>
      </div>
      <div class="sig-block">
        <div class="sig-label">Borrower</div>
        <div class="sig-name">${borrower.fullName}</div>
        <div class="sig-role">Borrower</div>
        <div class="sig-line-wrap">&nbsp;</div>
        <div class="sig-date-line">Signature &amp; Date: ___________________________</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>${tenant.name} &bull; ${contractNumber}</span>
    <span>Generated: ${fmt(new Date())}</span>
    <span>Page 1 of 1</span>
  </div>

</div>
</body>
</html>`.trim();
}
