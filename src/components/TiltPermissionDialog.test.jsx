/**
 * Descriptor: interaction coverage for the explicit phone-sensor setup dialog.
 * Usage: Vitest verifies accessible instructions and direct cancel/continue actions.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TiltPermissionDialog from "./TiltPermissionDialog.jsx";

const copy = Object.freeze({
  cancel: "Cancel",
  continueAndSetNeutral: "Continue & Set Neutral",
  tiltDialogBody: "Hold your phone at neutral.",
  tiltDialogNote: "Your browser may request access.",
  tiltDialogTitle: "Enable phone tilting?",
});

describe("TiltPermissionDialog", () => {
  it("stays absent until explicitly opened", () => {
    const { container } = render(<TiltPermissionDialog copy={copy} open={false} onCancel={() => undefined} onContinue={() => undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the setup instructions and preserves button gestures", () => {
    const onCancel = vi.fn();
    const onContinue = vi.fn();
    render(<TiltPermissionDialog copy={copy} open onCancel={onCancel} onContinue={onContinue} />);
    expect(screen.getByRole("dialog", { name: copy.tiltDialogTitle })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: copy.continueAndSetNeutral }));
    fireEvent.click(screen.getByRole("button", { name: copy.cancel }));
    expect(onContinue).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
