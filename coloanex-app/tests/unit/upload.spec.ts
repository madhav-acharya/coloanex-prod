const post = jest.fn();

jest.mock("@/api/client", () => ({
  __esModule: true,
  default: {
    post: (...args: any[]) => post(...args),
  },
}));

jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

import { uploadToCloudinary } from "../../utils/upload";

describe("upload", () => {
  beforeEach(() => {
    post.mockReset();
    global.FormData = class {
      private data: Array<{ key: string; value: any; fileName?: string }> = [];
      append(key: string, value: any, fileName?: string) {
        this.data.push({ key, value, fileName });
      }
    } as any;
  });

  it("returns data on success", async () => {
    post.mockResolvedValue({
      data: {
        data: {
          url: "https://img",
          publicId: "id",
          format: "jpg",
          width: 100,
          height: 100,
          bytes: 10,
        },
      },
    });

    const result = await uploadToCloudinary("file://image.jpg");
    expect(result.url).toBe("https://img");
  });

  it("throws error on failure", async () => {
    post.mockRejectedValue({
      response: { data: { message: "Upload failed" } },
    });

    await expect(uploadToCloudinary("file://image.jpg")).rejects.toThrow(
      "Upload failed",
    );
  });
});
