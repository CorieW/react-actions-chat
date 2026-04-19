import React from 'react';
import type { ChatTheme } from '../../js/types';
import { usePersistentButtonStore } from '../../lib';
import { cn } from '../../lib/utils';
import { getButtonVariantStyles } from '../shared/buttonVariantStyles';

/**
 * Props for the persistent action bar.
 *
 * @property theme Theme tokens used to style the persistent action bar and buttons.
 */
interface PersistentButtonsProps {
  readonly theme: ChatTheme;
}

/**
 * Renders the persistent action buttons shown above the input bar.
 *
 * @param props The `PersistentButtonsProps` object.
 */
export function PersistentButtons({
  theme,
}: PersistentButtonsProps): React.JSX.Element | null {
  const buttons = usePersistentButtonStore(state => state.buttons);

  if (buttons.length === 0) {
    return null;
  }

  return (
    <div
      className='flex flex-wrap justify-center gap-2 border-t px-4 py-3'
      role='region'
      aria-label='Chat persistent actions'
      data-asc-region='persistent-actions'
      style={{
        borderColor: `${theme.borderColor}40`,
        backgroundColor: theme.backgroundColor,
      }}
    >
      {buttons.map(button => {
        const variant = button.variant ?? 'default';
        const variantStyles = getButtonVariantStyles(variant, theme);
        const buttonStyles = { ...variantStyles, ...button.style };
        const baseClassName =
          'rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-1';
        const buttonClassName = cn(baseClassName, button.className);

        return (
          <button
            key={button.id}
            onClick={() => button.onClick?.()}
            className={buttonClassName}
            style={buttonStyles}
          >
            {button.label}
          </button>
        );
      })}
    </div>
  );
}
