jest.mock("react-native", () => ({
  Platform: {
    select: (map: any) => map.default,
  },
}));

import { Colors, Fonts } from "../../constants/theme";

describe("theme", () => {
  it("exposes core colors", () => {
    expect(Colors.light.primary).toBe("#16A34A");
    expect(Colors.dark.background).toBe("#111827");
  });

  it("resolves default fonts", () => {
    expect(Fonts.sans).toBe("normal");
    expect(Fonts.serif).toBe("serif");
  });
});
