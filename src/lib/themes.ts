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
  primaryColor: '#30363f', // Self message background (charcoal)
  secondaryColor: '#181c22', // Other message background (near-black)
  backgroundColor: '#0d0f12', // Chat container background (neutral black)
  textColor: '#f3f4f6', // Primary text (soft white)
  borderColor: '#262c34', // Border (cool gray)
  inputBackgroundColor: '#161a20', // Input background (dark gray)
  inputTextColor: '#e5e7eb', // Input text (light gray)
  buttonColor: '#3b424d', // Button (modern gray)
  buttonTextColor: '#f9fafb', // Button text (near-white)
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
