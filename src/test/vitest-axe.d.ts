/**
 * Type augmentation for vitest-axe matchers.
 * vitest-axe@0.1.0 targets the old Vi namespace; Vitest 3.x moved to @vitest/expect.
 *
 * We augment the `vitest` module (which re-exports Assertion from @vitest/expect)
 * rather than @vitest/expect directly, because @vitest/expect is not resolvable
 * from the project root in pnpm setups (no top-level node_modules/@vitest/expect
 * symlink exists).
 *
 * IMPORTANT: This file MUST have a top-level import so TypeScript treats
 * `declare module` as a module augmentation, NOT an ambient module declaration.
 * A bare `declare module "@vitest/expect" { ... }` in a script file would shadow
 * the real @vitest/expect package, stripping ExpectStatic of its call signatures
 * and causing ~1490 TypeScript errors across all test files.
 */
import "vitest";

declare module "vitest" {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
