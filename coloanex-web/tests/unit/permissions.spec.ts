import {
  extractUserPermissionIds,
  extractUserRoleIds,
  hasPermission,
} from "../../src/lib/permissions";

describe("permissions", () => {
  it("extracts role and permission ids from mixed shapes", () => {
    const user: any = {
      roles: [{ role: { id: "r1" } }, { id: "r2" }],
      permissions: [{ permission: { id: "p1" } }, { id: "p2" }],
    };

    expect(extractUserRoleIds(user)).toEqual(["r1", "r2"]);
    expect(extractUserPermissionIds(user)).toEqual(["p1", "p2"]);
  });

  it("grants permissions to super admin", () => {
    const user: any = {
      roles: [{ id: "1", name: "Super Admin" }],
      permissions: [],
    };

    expect(hasPermission(user, "AnyPermission")).toBe(true);
  });
});
