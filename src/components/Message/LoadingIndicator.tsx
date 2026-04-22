import React from 'react';
import type { ChatTheme } from '../../js/types';

/**
 * Props for the loading indicator.
 *
 * @property theme Theme tokens used to style the indicator.
 */
interface LoadingIndicatorProps {
  readonly theme: ChatTheme;
}

/**
 * Lightweight chat loading indicator shown while async work is in progress.
 *
 * @param props The `LoadingIndicatorProps` object.
 */
export function LoadingIndicator({
  theme,
}: LoadingIndicatorProps): React.JSX.Element {
  return (
    <div
      role='status'
      aria-live='polite'
      aria-label='Loading'
      className='asc-loading-indicator flex items-center gap-2 text-sm leading-relaxed'
      style={{ color: theme.textColor }}
    >
      <span
        aria-hidden='true'
        className='inline-flex items-center gap-1'
      >
        {[0, 1, 2].map(index => (
          <span
            key={index}
            className='asc-loading-dot inline-block h-2 w-2'
          />
        ))}
      </span>
    </div>
  );
}
