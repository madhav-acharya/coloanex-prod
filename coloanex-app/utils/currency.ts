const formatNumber = (num: number): string => {
  if (isNaN(num)) return "0.00";
  const parts = num.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

export const formatCurrency = (amount: any): string => {
  const num = Number(amount);
  if (amount === null || amount === undefined || isNaN(num)) {
    return "₨ 0.00";
  }
  return `₨ ${formatNumber(num)}`;
};

export const formatCurrencyShort = (amount: any): string => {
  const num = Number(amount);
  if (amount === null || amount === undefined || isNaN(num)) {
    return "₨ 0";
  }
  if (num >= 10000000) {
    return `₨ ${(num / 10000000).toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    return `₨ ${(num / 100000).toFixed(2)}L`;
  }
  if (num >= 1000) {
    return `₨ ${(num / 1000).toFixed(0)}K`;
  }
  return `₨ ${num}`;
};
