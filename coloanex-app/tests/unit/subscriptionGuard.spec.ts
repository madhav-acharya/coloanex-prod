import { ensureActiveSubscription } from "../../utils/subscriptionGuard";

const listMine = jest.fn();

jest.mock("@/api", () => ({
  subscriptionsApi: {
    listMine: (...args: any[]) => listMine(...args),
  },
}));

describe("subscriptionGuard", () => {
  beforeEach(() => {
    listMine.mockReset();
  });

  it("returns false when no active subscription", async () => {
    listMine.mockResolvedValue([]);
    const showToast = jest.fn();
    const result = await ensureActiveSubscription(showToast);
    expect(result).toBe(false);
    expect(showToast).toHaveBeenCalled();
  });

  it("returns true when active subscription has capacity", async () => {
    listMine.mockResolvedValue([
      {
        status: "ACTIVE",
        startsAt: new Date(Date.now() - 1000).toISOString(),
        endsAt: new Date(Date.now() + 1000).toISOString(),
        planRef: { maxTransactions: 10 },
        usageCount: 1,
      },
    ]);
    const showToast = jest.fn();
    const result = await ensureActiveSubscription(showToast);
    expect(result).toBe(true);
  });
});
