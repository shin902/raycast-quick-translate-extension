/**
 * Mock implementation of @raycast/api for testing
 */

export const getSelectedText = jest.fn();
export const Clipboard = {
  readText: jest.fn(),
  copy: jest.fn(),
  paste: jest.fn(),
};

export const showToast = jest.fn();

export const Detail = jest.fn();
export const ActionPanel = jest.fn();
export const Action = {
  CopyToClipboard: jest.fn(),
  Paste: jest.fn(),
  OpenInBrowser: jest.fn(),
  Open: jest.fn(),
};

export const Toast = {
  Style: {
    Success: "success",
    Failure: "failure",
    Animated: "animated",
  },
};

export const getPreferenceValues = jest.fn();
