import { formatCurrency, formatCurrencyShort } from "../../utils/currency";

describe("currency", () => {
  it("formats currency with commas", () => {
    expect(formatCurrency(1234.5)).toBe("₨ 1,234.50");
  });

  it("handles empty currency", () => {
    expect(formatCurrency(null)).toBe("₨ 0.00");
  });

  it("formats short currency", () => {
    expect(formatCurrencyShort(100000)).toBe("₨ 1.00L");
    expect(formatCurrencyShort(1500)).toBe("₨ 2K");
  });
});
