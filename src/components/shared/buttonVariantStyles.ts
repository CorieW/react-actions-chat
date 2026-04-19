import type { ChatTheme, MessageButtonVariant } from '../../js/types';

/**
 * Resolves background and text colors for a button variant.
 *
 * @param variant Variant to resolve.
 * @param theme Active chat theme.
 */
export function getButtonVariantStyles(
  variant: MessageButtonVariant,
  theme: ChatTheme
): { backgroundColor: string; color: string } {
  const defaultBackground = theme.buttonColor ?? '#3b82f6';
  const defaultColor = theme.buttonTextColor ?? '#ffffff';

  switch (variant) {
    case 'success':
      return {
        backgroundColor: '#10b981',
        color: '#ffffff',
      };
    case 'error':
      return {
        backgroundColor: '#ef4444',
        color: '#ffffff',
      };
    case 'warning':
      return {
        backgroundColor: '#f59e0b',
        color: '#ffffff',
      };
    case 'info':
      return {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      };
    case 'dull':
      return {
        backgroundColor: '#6b7280',
        color: '#ffffff',
      };
    case 'default':
    default:
      return {
        backgroundColor: defaultBackground,
        color: defaultColor,
      };
  }
}
