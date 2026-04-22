import React from 'react';
import { Download } from 'lucide-react';
import type {
  FileMessagePart,
  MessagePartRendererProps,
} from '../../../js/types';

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
 * Renders a downloadable file attachment.
 *
 * @param props The `MessagePartRendererProps<FileMessagePart>` object.
 */
export function FilePart({
  part,
  message,
  theme,
}: MessagePartRendererProps<FileMessagePart>): React.JSX.Element {
  const metadata = [part.mimeType, formatFileSize(part.sizeBytes)]
    .filter(Boolean)
    .join(' · ');
  const chromeColor =
    message.type === 'self' ? theme.buttonTextColor : theme.textColor;

  return (
    <a
      href={part.url}
      download={part.fileName}
      className='flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 no-underline transition-opacity hover:opacity-90'
      style={{
        borderColor: `${chromeColor}20`,
        color: chromeColor,
      }}
    >
      <div className='min-w-0'>
        <div className='truncate text-sm font-medium'>
          {part.fileName ?? 'Download file'}
        </div>
        {metadata ? (
          <div
            className='truncate text-xs'
            style={{ color: `${chromeColor}80` }}
          >
            {metadata}
          </div>
        ) : null}
      </div>
      <Download className='h-4 w-4 shrink-0' />
    </a>
  );
}
