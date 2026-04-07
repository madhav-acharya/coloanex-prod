export const formatCurrency = (amount: any): string => {
  const num = Number(amount);
  if (amount === null || amount === undefined || isNaN(num)) {
    return "₨ 0";
  }
  return `₨ ${num.toLocaleString("en-NP")}`;
};

export const formatCurrencyShort = (amount: any): string => {
  const num = Number(amount);
  if (amount === null || amount === undefined || isNaN(num)) {
    return "₨ 0";
  }
  if (amount >= 10000000) {
    return `₨ ${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `₨ ${(amount / 100000).toFixed(2)}L`;
  }
  if (amount >= 1000) {
    return `₨ ${(amount / 1000).toFixed(0)}K`;
  }
  return `₨ ${amount}`;
};
