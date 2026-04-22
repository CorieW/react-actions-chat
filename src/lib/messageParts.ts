import {
  createFilePart,
  createImagePart,
  type Message,
  type MessagePart,
  type TextMessagePart,
} from '../js/types';

const FALLBACK_UPLOAD_URL = 'data:,';
const DEFAULT_UPLOADED_IMAGE_MAX_WIDTH_PX = 480;
const DEFAULT_UPLOADED_IMAGE_MAX_HEIGHT_PX = 320;

function createUploadUrl(file: File): string {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(file);
  }

  return FALLBACK_UPLOAD_URL;
}

function getPartRawText(part: MessagePart): string {
  switch (part.type) {
    case 'text':
      return part.text;
    case 'image':
      return part.fileName ?? part.alt ?? 'Image attachment';
    case 'file':
      return part.fileName ?? 'File attachment';
  }
}

/**
 * Concatenates text part content from a message into a plain string.
 *
 * @param parts Message parts to flatten.
 */
export function getMessageRawText(parts: readonly MessagePart[]): string {
  return parts
    .map(getPartRawText)
    .filter(value => value.length > 0)
    .join('\n');
}

/**
 * Returns the first text part in a message, if present.
 *
 * @param parts Message parts to inspect.
 */
export function getFirstTextPart(
  parts: readonly MessagePart[]
): TextMessagePart | undefined {
  return parts.find(part => part.type === 'text');
}

/**
 * Creates built-in message parts for a set of uploaded files.
 *
 * Image files are rendered inline, while all other files are rendered as
 * downloadable attachments.
 *
 * @param files Files selected through the shared upload button.
 */
export function createMessagePartsFromFiles(
  files: readonly File[]
): readonly MessagePart[] {
  return files.map(file => {
    const url = createUploadUrl(file);

    if (file.type.startsWith('image/')) {
      return createImagePart(url, {
        alt: file.name,
        fileName: file.name,
        maxHeightPx: DEFAULT_UPLOADED_IMAGE_MAX_HEIGHT_PX,
        maxWidthPx: DEFAULT_UPLOADED_IMAGE_MAX_WIDTH_PX,
        mimeType: file.type,
        sizeBytes: file.size,
      });
    }

    return createFilePart(url, {
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  });
}

function getPartUploadUrl(part: MessagePart): string | undefined {
  if (
    (part.type === 'image' || part.type === 'file') &&
    part.url.startsWith('blob:')
  ) {
    return part.url;
  }

  return undefined;
}

function getMessageUploadUrls(
  messages: readonly Pick<Message, 'parts'>[]
): Set<string> {
  const urls = new Set<string>();

  messages.forEach(message => {
    message.parts.forEach(part => {
      const partUrl = getPartUploadUrl(part);

      if (partUrl) {
        urls.add(partUrl);
      }
    });
  });

  return urls;
}

/**
 * Releases blob URLs created for uploaded file parts in the provided messages.
 *
 * @param messages Messages whose upload parts should be considered for cleanup.
 * @param retainedMessages Optional next message list whose upload URLs should
 * remain available.
 */
export function revokeMessagePartUploadUrls(
  messages: readonly Pick<Message, 'parts'>[],
  retainedMessages: readonly Pick<Message, 'parts'>[] = []
): void {
  if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
    return;
  }

  const retainedUrls = getMessageUploadUrls(retainedMessages);

  getMessageUploadUrls(messages).forEach(url => {
    if (!retainedUrls.has(url)) {
      URL.revokeObjectURL(url);
    }
  });
}
