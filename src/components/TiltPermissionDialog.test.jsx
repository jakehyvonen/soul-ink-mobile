/**
 * Descriptor: interaction coverage for the explicit phone-sensor setup dialog.
 * Usage: Vitest verifies accessible instructions and direct cancel/continue actions.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TiltPermissionDialog from "./TiltPermissionDialog.jsx";

const copy = Object.freeze({
  braveSensorSteps: ["Open Settings.", "Allow Motion sensors.", "Return and test again."],
  braveSensorsBlockedBody: "Brave returned empty sensor readings.",
  braveSensorsBlockedTitle: "Brave is blocking motion sensors",
  cancel: "Cancel",
  continueWithoutTilting: "Initialize Without Tilting",
  continueAndSetNeutral: "Continue & Set Neutral",
  phoneSensorsBlockedBody: "No usable readings arrived.",
  phoneSensorsBlockedNote: "Changing Shields alone may not enable sensors.",
  phoneSensorsBlockedTitle: "Phone motion sensors are blocked",
  testingSensors: "Testing Sensors…",
  testSensorsAgain: "Test Sensors Again",
  tiltDialogBody: "Hold your phone at neutral.",
  tiltDialogNote: "Your browser may request access.",
  tiltDialogTitle: "Enable phone tilting?",
});

describe("TiltPermissionDialog", () => {
  it("stays absent until explicitly opened", () => {
    const { container } = render(<TiltPermissionDialog copy={copy} mode={null} onCancel={() => undefined} onContinue={() => undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the setup instructions and preserves button gestures", () => {
    const onCancel = vi.fn();
    const onContinue = vi.fn();
    render(<TiltPermissionDialog copy={copy} mode="setup" onCancel={onCancel} onContinue={onContinue} />);
    expect(screen.getByRole("dialog", { name: copy.tiltDialogTitle })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.continueAndSetNeutral }));
    fireEvent.click(screen.getByRole("button", { name: copy.cancel }));
    expect(onContinue).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("gives Brave users the exact Motion sensors recovery path", () => {
    render(<TiltPermissionDialog brave continueWithoutTilting copy={copy} mode="blocked" onCancel={() => undefined} onContinue={() => undefined} />);
    expect(screen.getByRole("dialog", { name: copy.braveSensorsBlockedTitle })).toBeInTheDocument();
    expect(screen.getByText(copy.braveSensorSteps[1])).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.testSensorsAgain })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.continueWithoutTilting })).toBeInTheDocument();
  });
});
