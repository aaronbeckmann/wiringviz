export {};

declare global {
  interface Window {
    /** Exposed by electron/preload.cjs when running as a desktop app. */
    desktop?: {
      minimize: () => void;
      toggleMaximize: () => void;
      close: () => void;
      onMaximizeChange: (cb: (maximized: boolean) => void) => () => void;
    };
  }
}
