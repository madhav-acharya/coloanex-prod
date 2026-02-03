export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "Rs 0";
  }
  return `Rs ${amount.toLocaleString("en-NP")}`;
};

export const formatCurrencyShort = (
  amount: number | null | undefined,
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "Rs 0";
  }
  if (amount >= 10000000) {
    return `Rs ${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `Rs ${(amount / 100000).toFixed(2)}L`;
  }
  if (amount >= 1000) {
    return `Rs ${(amount / 1000).toFixed(0)}K`;
  }
  return `Rs ${amount}`;
};
