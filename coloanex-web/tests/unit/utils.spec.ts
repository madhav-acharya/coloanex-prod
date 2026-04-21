import { cn } from "../../src/lib/utils";

describe("utils", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
});
