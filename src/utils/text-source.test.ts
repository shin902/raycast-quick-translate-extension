/**
 * Unit tests for text source utility functions
 */

import { validateTextLength } from "./text-source";
import { MAX_TEXT_LENGTH, ERROR_MESSAGES } from "../constants";

describe("validateTextLength", () => {
  it("should not throw for text within length limit", () => {
    const validText = "a".repeat(MAX_TEXT_LENGTH);
    expect(() => validateTextLength(validText)).not.toThrow();
  });

  it("should not throw for text exactly at length limit", () => {
    const validText = "a".repeat(MAX_TEXT_LENGTH);
    expect(() => validateTextLength(validText)).not.toThrow();
  });

  it("should throw for text exceeding length limit", () => {
    const tooLongText = "a".repeat(MAX_TEXT_LENGTH + 1);
    expect(() => validateTextLength(tooLongText)).toThrow(
      ERROR_MESSAGES.TEXT_TOO_LONG(MAX_TEXT_LENGTH + 1),
    );
  });

  it("should trim text before checking length", () => {
    const textWithWhitespace = "a".repeat(MAX_TEXT_LENGTH) + "   ";
    expect(() => validateTextLength(textWithWhitespace)).not.toThrow();
  });

  it("should throw for text exceeding limit after trim", () => {
    const tooLongTextWithWhitespace = "a".repeat(MAX_TEXT_LENGTH + 1) + "   ";
    expect(() => validateTextLength(tooLongTextWithWhitespace)).toThrow();
  });

  it("should not throw for empty text", () => {
    // Empty text validation is handled elsewhere
    expect(() => validateTextLength("")).not.toThrow();
  });

  it("should not throw for whitespace-only text", () => {
    // Empty text validation is handled elsewhere
    expect(() => validateTextLength("   ")).not.toThrow();
  });
});
