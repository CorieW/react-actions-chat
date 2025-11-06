import type { ChatTheme } from '../js/types';

// Preset light and dark themes
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

export const DARK_THEME: ChatTheme = {
  primaryColor: '#3b82f6', // Self message background (blue)
  secondaryColor: '#374151', // Other message background (gray-700)
  backgroundColor: '#111827', // Chat container background (gray-900)
  textColor: '#f9fafb', // Primary text (gray-50)
  borderColor: '#4b5563', // Border (gray-600)
  inputBackgroundColor: '#1f2937', // Input background (gray-800)
  inputTextColor: '#f9fafb', // Input text (gray-50)
  buttonColor: '#3b82f6', // Button (blue-600)
  buttonTextColor: '#ffffff', // Button text (white)
};

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
