import React from 'react';
import type {
  ImageMessagePart,
  MessagePartRendererProps,
} from '../../../js/types';

function getPreviewDimension(value: number | undefined): string | undefined {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return `${value}px`;
}

function formatFileSize(sizeBytes: number | undefined): string | null {
  if (sizeBytes === undefined) {
    return null;
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Renders an image part inline inside a message bubble.
 *
 * @param props The `MessagePartRendererProps<ImageMessagePart>` object.
 */
export function ImagePart({
  part,
  message,
  theme,
}: MessagePartRendererProps<ImageMessagePart>): React.JSX.Element {
  const metadata = [part.fileName, formatFileSize(part.sizeBytes)]
    .filter(Boolean)
    .join(' · ');
  const imageLabel = part.alt ?? part.fileName ?? 'Uploaded image';
  const chromeColor =
    message.type === 'self' ? theme.buttonTextColor : theme.textColor;
  const maxWidth = getPreviewDimension(part.maxWidthPx);
  const maxHeight = getPreviewDimension(part.maxHeightPx) ?? '320px';

  return (
    <figure className='space-y-2'>
      <a
        href={part.url}
        target='_blank'
        rel='noreferrer'
        className='inline-block max-w-full overflow-hidden rounded-2xl border'
        style={{ borderColor: `${chromeColor}20` }}
      >
        <img
          src={part.url}
          alt={imageLabel}
          className='block h-auto max-w-full rounded-2xl'
          style={{
            ...(maxWidth ? { maxWidth } : {}),
            ...(maxHeight ? { maxHeight } : {}),
          }}
        />
      </a>
      {metadata ? (
        <figcaption
          className='text-xs'
          style={{ color: `${chromeColor}80` }}
        >
          {metadata}
        </figcaption>
      ) : null}
    </figure>
  );
}
