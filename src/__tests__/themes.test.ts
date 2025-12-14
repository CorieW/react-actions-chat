import { describe, it, expect } from 'vitest';
import {
  LIGHT_THEME,
  DARK_THEME,
  getResolvedTheme,
  getThemeStyles,
} from '../lib/themes';
import type { ChatTheme } from '../js/types';

describe('Theme System Unit Tests', () => {
  describe('LIGHT_THEME', () => {
    it('should have all required properties', () => {
      expect(LIGHT_THEME).toHaveProperty('primaryColor');
      expect(LIGHT_THEME).toHaveProperty('secondaryColor');
      expect(LIGHT_THEME).toHaveProperty('backgroundColor');
      expect(LIGHT_THEME).toHaveProperty('textColor');
      expect(LIGHT_THEME).toHaveProperty('borderColor');
      expect(LIGHT_THEME).toHaveProperty('inputBackgroundColor');
      expect(LIGHT_THEME).toHaveProperty('inputTextColor');
      expect(LIGHT_THEME).toHaveProperty('buttonColor');
      expect(LIGHT_THEME).toHaveProperty('buttonTextColor');
    });

    it('should have light color values', () => {
      expect(LIGHT_THEME.backgroundColor).toBe('#f3f4f6');
      expect(LIGHT_THEME.textColor).toBe('#111827');
      expect(LIGHT_THEME.inputBackgroundColor).toBe('#fff');
    });
  });

  describe('DARK_THEME', () => {
    it('should have all required properties', () => {
      expect(DARK_THEME).toHaveProperty('primaryColor');
      expect(DARK_THEME).toHaveProperty('secondaryColor');
      expect(DARK_THEME).toHaveProperty('backgroundColor');
      expect(DARK_THEME).toHaveProperty('textColor');
      expect(DARK_THEME).toHaveProperty('borderColor');
      expect(DARK_THEME).toHaveProperty('inputBackgroundColor');
      expect(DARK_THEME).toHaveProperty('inputTextColor');
      expect(DARK_THEME).toHaveProperty('buttonColor');
      expect(DARK_THEME).toHaveProperty('buttonTextColor');
    });

    it('should have dark color values', () => {
      expect(DARK_THEME.backgroundColor).toBe('#111827');
      expect(DARK_THEME.textColor).toBe('#f9fafb');
      expect(DARK_THEME.inputBackgroundColor).toBe('#1f2937');
    });
  });

  describe('getResolvedTheme', () => {
    it('should return LIGHT_THEME for "light" string', () => {
      const theme = getResolvedTheme('light');

      expect(theme).toEqual(LIGHT_THEME);
      expect(theme.backgroundColor).toBe(LIGHT_THEME.backgroundColor);
    });

    it('should return DARK_THEME for "dark" string', () => {
      const theme = getResolvedTheme('dark');

      expect(theme).toEqual(DARK_THEME);
      expect(theme.backgroundColor).toBe(DARK_THEME.backgroundColor);
    });

    it('should return DARK_THEME for undefined', () => {
      const theme = getResolvedTheme(undefined);

      expect(theme).toEqual(DARK_THEME);
    });

    it('should merge custom theme object with DARK_THEME base', () => {
      const customTheme: ChatTheme = {
        primaryColor: '#ff0000',
        backgroundColor: '#ffffff',
      };

      const resolvedTheme = getResolvedTheme(customTheme);

      // Custom properties should be applied
      expect(resolvedTheme.primaryColor).toBe('#ff0000');
      expect(resolvedTheme.backgroundColor).toBe('#ffffff');

      // Other properties should come from DARK_THEME
      expect(resolvedTheme.textColor).toBe(DARK_THEME.textColor);
      expect(resolvedTheme.buttonColor).toBe(DARK_THEME.buttonColor);
    });

    it('should handle complete custom theme object', () => {
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

      const resolvedTheme = getResolvedTheme(customTheme);

      expect(resolvedTheme).toEqual(customTheme);
    });

    it('should handle partial theme with single property', () => {
      const customTheme: ChatTheme = {
        primaryColor: '#custom',
      };

      const resolvedTheme = getResolvedTheme(customTheme);

      expect(resolvedTheme.primaryColor).toBe('#custom');
      expect(resolvedTheme.secondaryColor).toBe(DARK_THEME.secondaryColor);
      expect(resolvedTheme.backgroundColor).toBe(DARK_THEME.backgroundColor);
    });

    it('should not mutate original theme objects', () => {
      const originalDarkTheme = { ...DARK_THEME };
      const originalLightTheme = { ...LIGHT_THEME };

      getResolvedTheme('dark');
      getResolvedTheme('light');
      getResolvedTheme({ primaryColor: '#custom' });

      expect(DARK_THEME).toEqual(originalDarkTheme);
      expect(LIGHT_THEME).toEqual(originalLightTheme);
    });
  });

  describe('getThemeStyles', () => {
    it('should generate CSS custom properties from theme', () => {
      const styles = getThemeStyles(LIGHT_THEME);

      expect(styles).toHaveProperty('--chat-primary-color');
      expect(styles).toHaveProperty('--chat-secondary-color');
      expect(styles).toHaveProperty('--chat-background-color');
      expect(styles).toHaveProperty('--chat-text-color');
      expect(styles).toHaveProperty('--chat-border-color');
      expect(styles).toHaveProperty('--chat-input-background-color');
      expect(styles).toHaveProperty('--chat-input-text-color');
      expect(styles).toHaveProperty('--chat-button-color');
      expect(styles).toHaveProperty('--chat-button-text-color');
    });

    it('should map theme properties to correct CSS variables', () => {
      const styles = getThemeStyles(LIGHT_THEME);

      expect(styles['--chat-primary-color']).toBe(LIGHT_THEME.primaryColor);
      expect(styles['--chat-secondary-color']).toBe(LIGHT_THEME.secondaryColor);
      expect(styles['--chat-background-color']).toBe(
        LIGHT_THEME.backgroundColor
      );
      expect(styles['--chat-text-color']).toBe(LIGHT_THEME.textColor);
      expect(styles['--chat-border-color']).toBe(LIGHT_THEME.borderColor);
      expect(styles['--chat-input-background-color']).toBe(
        LIGHT_THEME.inputBackgroundColor
      );
      expect(styles['--chat-input-text-color']).toBe(
        LIGHT_THEME.inputTextColor
      );
      expect(styles['--chat-button-color']).toBe(LIGHT_THEME.buttonColor);
      expect(styles['--chat-button-text-color']).toBe(
        LIGHT_THEME.buttonTextColor
      );
    });

    it('should work with custom theme', () => {
      const customTheme: ChatTheme = {
        primaryColor: '#custom1',
        secondaryColor: '#custom2',
        backgroundColor: '#custom3',
        textColor: '#custom4',
        borderColor: '#custom5',
        inputBackgroundColor: '#custom6',
        inputTextColor: '#custom7',
        buttonColor: '#custom8',
        buttonTextColor: '#custom9',
      };

      const styles = getThemeStyles(customTheme);

      expect(styles['--chat-primary-color']).toBe('#custom1');
      expect(styles['--chat-secondary-color']).toBe('#custom2');
      expect(styles['--chat-background-color']).toBe('#custom3');
      expect(styles['--chat-text-color']).toBe('#custom4');
      expect(styles['--chat-border-color']).toBe('#custom5');
      expect(styles['--chat-input-background-color']).toBe('#custom6');
      expect(styles['--chat-input-text-color']).toBe('#custom7');
      expect(styles['--chat-button-color']).toBe('#custom8');
      expect(styles['--chat-button-text-color']).toBe('#custom9');
    });

    it('should handle partial theme (merged with defaults)', () => {
      const partialTheme: ChatTheme = {
        primaryColor: '#partial',
      };

      // First resolve the theme to get defaults
      const resolvedTheme = getResolvedTheme(partialTheme);
      const styles = getThemeStyles(resolvedTheme);

      expect(styles['--chat-primary-color']).toBe('#partial');
      expect(styles['--chat-text-color']).toBe(DARK_THEME.textColor);
    });

    it('should return React.CSSProperties compatible object', () => {
      const styles = getThemeStyles(DARK_THEME);

      // Should be usable as inline styles in React
      expect(typeof styles).toBe('object');
      expect(styles).not.toBeNull();
    });
  });

  describe('theme integration', () => {
    it('should resolve and style light theme correctly', () => {
      const resolvedTheme = getResolvedTheme('light');
      const styles = getThemeStyles(resolvedTheme);

      expect(styles['--chat-background-color']).toBe('#f3f4f6');
      expect(styles['--chat-text-color']).toBe('#111827');
    });

    it('should resolve and style dark theme correctly', () => {
      const resolvedTheme = getResolvedTheme('dark');
      const styles = getThemeStyles(resolvedTheme);

      expect(styles['--chat-background-color']).toBe('#111827');
      expect(styles['--chat-text-color']).toBe('#f9fafb');
    });

    it('should handle complete custom theme workflow', () => {
      const customTheme: ChatTheme = {
        primaryColor: '#e74c3c',
        secondaryColor: '#ecf0f1',
        backgroundColor: '#2c3e50',
        textColor: '#ffffff',
        borderColor: '#34495e',
        inputBackgroundColor: '#34495e',
        inputTextColor: '#ecf0f1',
        buttonColor: '#3498db',
        buttonTextColor: '#ffffff',
      };

      const resolvedTheme = getResolvedTheme(customTheme);
      const styles = getThemeStyles(resolvedTheme);

      // Verify resolution
      expect(resolvedTheme.primaryColor).toBe('#e74c3c');
      expect(resolvedTheme.backgroundColor).toBe('#2c3e50');

      // Verify styles
      expect(styles['--chat-primary-color']).toBe('#e74c3c');
      expect(styles['--chat-background-color']).toBe('#2c3e50');
    });

    it('should handle undefined theme with full workflow', () => {
      const resolvedTheme = getResolvedTheme(undefined);
      const styles = getThemeStyles(resolvedTheme);

      // Should default to dark theme
      expect(resolvedTheme).toEqual(DARK_THEME);
      expect(styles['--chat-background-color']).toBe(DARK_THEME.backgroundColor);
    });
  });

  describe('edge cases', () => {
    it('should handle empty theme object', () => {
      const emptyTheme: ChatTheme = {};
      const resolvedTheme = getResolvedTheme(emptyTheme);

      // Should have all DARK_THEME properties
      expect(resolvedTheme).toEqual(DARK_THEME);
    });

    it('should handle theme with undefined values', () => {
      const themeWithUndefined: ChatTheme = {
        primaryColor: undefined,
        backgroundColor: '#custom',
      };

      const resolvedTheme = getResolvedTheme(themeWithUndefined);

      // When merging, undefined values are preserved by spread operator
      // This is expected behavior - users should omit properties rather than set to undefined
      expect(resolvedTheme.primaryColor).toBeUndefined();
      expect(resolvedTheme.backgroundColor).toBe('#custom');
    });

    it('should preserve all color formats', () => {
      const theme: ChatTheme = {
        primaryColor: '#fff',
        secondaryColor: '#ffffff',
        backgroundColor: 'rgb(255, 255, 255)',
        textColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'hsl(0, 0%, 50%)',
      };

      const resolvedTheme = getResolvedTheme(theme);
      const styles = getThemeStyles(resolvedTheme);

      expect(styles['--chat-primary-color']).toBe('#fff');
      expect(styles['--chat-secondary-color']).toBe('#ffffff');
      expect(styles['--chat-background-color']).toBe('rgb(255, 255, 255)');
      expect(styles['--chat-text-color']).toBe('rgba(0, 0, 0, 0.8)');
      expect(styles['--chat-border-color']).toBe('hsl(0, 0%, 50%)');
    });
  });
});

