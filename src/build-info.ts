// Vite's `define` replaces these at build time (see vite.config.ts).
declare const __BUILD_HASH__: string;
declare const __BUILT_AT__: string;

// Short commit hash of this build, or `dev` when git isn't available.
export const BUILD_HASH = __BUILD_HASH__;
// ISO timestamp of when the build (or dev server) started.
export const BUILT_AT = __BUILT_AT__;
