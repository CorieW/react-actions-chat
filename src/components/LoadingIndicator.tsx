import { useEffect, useState } from 'react';
import type { ChatTheme } from '../js/types';

interface LoadingIndicatorProps {
  /** Optional status text announced to assistive technology while loading. */
  readonly label?: string | undefined;
  /** Theme tokens used to style the indicator. */
  readonly theme: ChatTheme;
  /** Renders the indicator inside a chat bubble when true. */
  readonly bubble?: boolean | undefined;
}

/**
 * Lightweight chat loading indicator shown while async work is in progress.
 */
export function LoadingIndicator({
  label,
  theme,
  bubble = true,
}: LoadingIndicatorProps): React.JSX.Element {
  const [visibleDotCount, setVisibleDotCount] = useState(1);
  const accessibleLabel = label && label.trim() !== '' ? label : 'Loading';

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
      aria-label={accessibleLabel}
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

  if (!bubble) {
    return dots;
  }

  return (
    <div className='mb-1 flex gap-3'>
      <div className='max-w-[85%]'>
        <div
          className='mr-auto rounded-lg px-4 py-3 shadow-sm'
          style={{
            background: `${theme.secondaryColor}f5`,
            color: theme.textColor,
            maxWidth: 'fit-content',
          }}
        >
          {dots}
        </div>
      </div>
    </div>
  );
}
