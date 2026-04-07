export const isWebPlatform = (): boolean => {
  return typeof window !== "undefined" && !(window as any).ReactNativeWebView;
};

export const isAppPlatform = (): boolean => {
  return typeof window !== "undefined" && !!(window as any).ReactNativeWebView;
};
