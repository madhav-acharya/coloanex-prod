import {
  canAccessAdminRoutes,
  canAccessBorrowerRoutes,
  getHomeRoute,
} from "../../src/lib/roleUtils";

describe("roleUtils", () => {
  it("routes admin to dashboard", () => {
    const user: any = {
      roles: [{ role: { name: "Admin" } }],
    };

    expect(getHomeRoute(user)).toBe("/dashboard");
    expect(canAccessAdminRoutes(user)).toBe(true);
  });

  it("routes borrower to borrower dashboard", () => {
    const user: any = {
      roles: [{ role: { name: "Borrower" } }],
    };

    expect(getHomeRoute(user)).toBe("/borrower/dashboard");
    expect(canAccessBorrowerRoutes(user)).toBe(true);
  });
});
