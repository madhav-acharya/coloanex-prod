export const formatCurrency = (amount: number): string => {
  return `Rs ${amount.toLocaleString("en-NP")}`;
};

export const formatCurrencyShort = (amount: number): string => {
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
