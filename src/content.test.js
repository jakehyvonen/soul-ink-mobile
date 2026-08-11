/**
 * Descriptor: localized Soul Ink Mobile path-selection tests.
 * Usage: npm test verifies English and German hosted routes select stable catalogs.
 */

import { describe, expect, it } from "vitest";
import { mobileCopy, mobileLocale } from "./content.js";

describe("mobile content", () => {
  it("uses English on the unprefixed and Pi-local routes", () => {
    expect(mobileLocale("/mobile/")).toBe("en");
    expect(mobileCopy.en.stopAll).toBe("STOP ALL");
  });

  it("uses draft German control text below the German route", () => {
    expect(mobileLocale("/de/mobile/")).toBe("de");
    expect(mobileCopy.de.stopAll).toBe("ALLES STOPPEN");
  });
});
