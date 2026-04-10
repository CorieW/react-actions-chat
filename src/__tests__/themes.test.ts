import { describe, expect, it } from 'vitest';
import {
  DARK_THEME,
  LIGHT_THEME,
  getResolvedTheme,
  getThemeStyles,
} from '../lib/themes';
import type { ChatTheme } from '../js/types';

describe('Theme system unit tests', () => {
  it('resolves built-in theme names and defaults to dark', () => {
    expect(getResolvedTheme('light')).toEqual(LIGHT_THEME);
    expect(getResolvedTheme('dark')).toEqual(DARK_THEME);
    expect(getResolvedTheme(undefined)).toEqual(DARK_THEME);
  });

  it('merges partial custom theme values over the dark base', () => {
    const customTheme: ChatTheme = {
      primaryColor: '#ff0000',
      backgroundColor: '#ffffff',
    };

    const resolved = getResolvedTheme(customTheme);

    expect(resolved.primaryColor).toBe('#ff0000');
    expect(resolved.backgroundColor).toBe('#ffffff');
    expect(resolved.textColor).toBe(DARK_THEME.textColor);
    expect(resolved.buttonColor).toBe(DARK_THEME.buttonColor);
  });

  it('does not mutate built-in theme constants when resolving themes', () => {
    const darkBefore = { ...DARK_THEME };
    const lightBefore = { ...LIGHT_THEME };

    getResolvedTheme('dark');
    getResolvedTheme('light');
    getResolvedTheme({ primaryColor: '#custom' });

    expect(DARK_THEME).toEqual(darkBefore);
    expect(LIGHT_THEME).toEqual(lightBefore);
  });

  it('returns all provided values for fully specified custom themes', () => {
    const customTheme: ChatTheme = {
      primaryColor: '#111111',
      secondaryColor: '#222222',
      backgroundColor: '#333333',
      textColor: '#444444',
      borderColor: '#555555',
      inputBackgroundColor: '#666666',
      inputTextColor: '#777777',
      buttonColor: '#888888',
      buttonTextColor: '#999999',
    };

    expect(getResolvedTheme(customTheme)).toEqual(customTheme);
  });

  it('maps resolved themes to CSS custom properties', () => {
    const styles = getThemeStyles(LIGHT_THEME) as Record<string, unknown>;

    expect(styles).toMatchObject({
      '--chat-primary-color': LIGHT_THEME.primaryColor,
      '--chat-secondary-color': LIGHT_THEME.secondaryColor,
      '--chat-background-color': LIGHT_THEME.backgroundColor,
      '--chat-text-color': LIGHT_THEME.textColor,
      '--chat-border-color': LIGHT_THEME.borderColor,
      '--chat-input-background-color': LIGHT_THEME.inputBackgroundColor,
      '--chat-input-text-color': LIGHT_THEME.inputTextColor,
      '--chat-button-color': LIGHT_THEME.buttonColor,
      '--chat-button-text-color': LIGHT_THEME.buttonTextColor,
    });
  });

  it('supports different valid CSS color formats end-to-end', () => {
    const theme: ChatTheme = {
      primaryColor: '#fff',
      secondaryColor: '#ffffff',
      backgroundColor: 'rgb(255, 255, 255)',
      textColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'hsl(0, 0%, 50%)',
    };

    const resolved = getResolvedTheme(theme);
    const styles = getThemeStyles(resolved) as Record<string, unknown>;

    expect(styles['--chat-primary-color']).toBe('#fff');
    expect(styles['--chat-secondary-color']).toBe('#ffffff');
    expect(styles['--chat-background-color']).toBe('rgb(255, 255, 255)');
    expect(styles['--chat-text-color']).toBe('rgba(0, 0, 0, 0.8)');
    expect(styles['--chat-border-color']).toBe('hsl(0, 0%, 50%)');
  });
});
