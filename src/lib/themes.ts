import type { ChatTheme } from '../js/types';

/**
 * Built-in light theme preset for the chat UI.
 */
export const LIGHT_THEME: ChatTheme = {
  primaryColor: '#3b82f6', // Blue for self messages
  secondaryColor: '#e5e7eb', // Light gray for other messages
  backgroundColor: '#f3f4f6', // Light background
  textColor: '#111827', // Very dark text
  borderColor: '#e5e7eb', // Light gray borders
  inputBackgroundColor: '#fff', // White input
  inputTextColor: '#111827', // Dark text input
  buttonColor: '#3b82f6', // Blue button
  buttonTextColor: '#ffffff', // White button text
};

/**
 * Built-in dark theme preset for the chat UI.
 */
export const DARK_THEME: ChatTheme = {
  primaryColor: '#4a7fc1', // Self message background (medium blue)
  secondaryColor: '#1a2942', // Other message background (dark blue-gray)
  backgroundColor: '#0f1729', // Chat container background (very dark navy)
  textColor: '#d1dae6', // Primary text (light gray-blue)
  borderColor: '#1a2942', // Border (dark blue-gray)
  inputBackgroundColor: '#1a2942', // Input background (dark blue-gray)
  inputTextColor: '#9ca7b8', // Input text (muted gray-blue)
  buttonColor: '#5b8dd8', // Button (brighter blue)
  buttonTextColor: '#ffffff', // Button text (white)
};

/**
 * Accepted theme inputs for the chat component and helpers.
 */
export type ThemeInput = 'light' | 'dark' | ChatTheme | undefined;

/**
 * Resolves a theme input to a complete ChatTheme object.
 *
 * @param theme - The theme input (string, object, or undefined)
 * @returns A complete ChatTheme object
 */
export function getResolvedTheme(theme: ThemeInput): ChatTheme {
  if (!theme || theme === 'dark') return { ...DARK_THEME };
  if (theme === 'light') return { ...LIGHT_THEME };
  // custom object: merge it over dark as base (to retain all properties)
  return { ...DARK_THEME, ...theme };
}

/**
 * Generates CSS custom properties from a ChatTheme object.
 *
 * @param theme - The theme to convert to CSS properties
 * @returns CSS properties object with theme variables
 */
export function getThemeStyles(theme: ChatTheme): React.CSSProperties {
  return {
    '--chat-primary-color': theme.primaryColor,
    '--chat-secondary-color': theme.secondaryColor,
    '--chat-background-color': theme.backgroundColor,
    '--chat-text-color': theme.textColor,
    '--chat-border-color': theme.borderColor,
    '--chat-input-background-color': theme.inputBackgroundColor,
    '--chat-input-text-color': theme.inputTextColor,
    '--chat-button-color': theme.buttonColor,
    '--chat-button-text-color': theme.buttonTextColor,
  } as React.CSSProperties;
}
