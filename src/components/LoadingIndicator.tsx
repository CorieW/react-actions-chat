import React, { useEffect, useState } from 'react';
import type { ChatTheme } from '../js/types';

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
 * @param props The loading indicator props.
 */
export function LoadingIndicator({
  theme,
}: LoadingIndicatorProps): React.JSX.Element {
  const [visibleDotCount, setVisibleDotCount] = useState(1);

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => {
      setVisibleDotCount(currentCount =>
        currentCount === 3 ? 1 : currentCount + 1
      );
    }, 240);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, []);

  const dots = (
    <div
      role='status'
      aria-live='polite'
      aria-label='Loading'
      className='flex items-center text-sm leading-relaxed'
    >
      <span
        aria-hidden='true'
        className='inline-flex min-w-[1.8rem] font-mono text-base font-semibold'
        style={{
          color: theme.textColor,
        }}
      >
        {[0, 1, 2].map(index => (
          <span
            key={index}
            style={{
              visibility: index < visibleDotCount ? 'visible' : 'hidden',
            }}
          >
            .
          </span>
        ))}
      </span>
    </div>
  );

  return dots;
}
