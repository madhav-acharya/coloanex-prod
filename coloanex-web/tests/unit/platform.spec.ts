import { isAppPlatform, isWebPlatform } from "../../src/utils/platform";
import { vi } from "vitest";

describe("platform", () => {
  it("detects web platform", () => {
    vi.stubGlobal("window", {} as any);
    expect(isWebPlatform()).toBe(true);
    expect(isAppPlatform()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("detects app platform", () => {
    vi.stubGlobal("window", { ReactNativeWebView: {} } as any);
    expect(isWebPlatform()).toBe(false);
    expect(isAppPlatform()).toBe(true);
    vi.unstubAllGlobals();
  });
});
