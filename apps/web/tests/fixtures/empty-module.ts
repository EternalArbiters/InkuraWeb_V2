// Stub for the "server-only" / "client-only" marker packages.
//
// Next.js aliases both internally during its own build, so `server-only` is not
// actually installed in node_modules. Vitest runs through Vite, which knows
// nothing about that alias, and every module under server/** that starts with
// `import "server-only"` failed to load because of it.
//
// In a plain Node test environment those markers have nothing to guard, so
// resolving them to this empty module is the correct no-op.
export {};
