/**
 * Descriptor: Shared DOM assertions for PBM Vitest suites.
 * Usage: vite.config.js loads this before every browser-oriented unit test.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/** Remove rendered DOM between tests. Usage: Vitest invokes after every test case. */
afterEach(() => cleanup());
