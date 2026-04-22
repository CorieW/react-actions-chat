import { useMemo } from 'react';
import type {
  ChatTheme,
  InputMessage,
  MessageButton,
} from 'react-actions-chat';
import {
  Chat,
  createButton,
  createMarkdownTextPart,
  createRequestInputButtonDef,
  createTextPart,
  useChatStore,
} from 'react-actions-chat';

type UploadDemoTopic = 'screenshot' | 'attachment' | 'explain';

const UPLOAD_THEME: ChatTheme = {
  primaryColor: '#0d4ed8',
  secondaryColor: '#f6e9d3',
  backgroundColor: '#fffaf3',
  textColor: '#2f2216',
  borderColor: '#c6ab88',
  inputBackgroundColor: '#fff7ec',
  inputTextColor: '#2f2216',
  buttonColor: '#d97706',
  buttonTextColor: '#140c03',
};

const BLOCKED_ATTACHMENT_EXTENSIONS = ['.app', '.bat', '.cmd', '.dmg', '.exe'];

function addAssistantTextMessage(
  text: string,
  buttons: readonly MessageButton[] = createPrimaryButtons()
): void {
  useChatStore.getState().addMessage({
    type: 'other',
    parts: [createTextPart(text)],
    buttons,
  });
}

function addAssistantMarkdownMessage(
  markdown: string,
  buttons: readonly MessageButton[] = createPrimaryButtons()
): void {
  useChatStore.getState().addMessage({
    type: 'other',
    parts: [createMarkdownTextPart(markdown)],
    buttons,
  });
}

function hasBlockedAttachmentExtension(fileName: string): boolean {
  const normalizedFileName = fileName.toLowerCase();

  return BLOCKED_ATTACHMENT_EXTENSIONS.some(extension => {
    return normalizedFileName.endsWith(extension);
  });
}

function listUploadedFileNames(files: readonly File[]): string {
  const fileNames = files.map(file => file.name);

  if (fileNames.length === 0) {
    return 'your upload';
  }

  if (fileNames.length === 1) {
    return fileNames[0] ?? 'your upload';
  }

  return `${fileNames.slice(0, -1).join(', ')}, and ${fileNames[fileNames.length - 1]}`;
}

function formatOptionalNote(note: string): string | null {
  const trimmedNote = note.trim();

  return trimmedNote.length > 0 ? trimmedNote : null;
}

const SCREENSHOT_BUTTON_DEF = createRequestInputButtonDef({
  initialLabel: 'Share screenshot',
  inputPromptMessage:
    'Upload one or more screenshots and add an optional note if you want extra context.',
  placeholder: 'Optional note about the screen state or bug',
  inputDescription:
    'Image uploads render inline as `image` parts. Try PNG, JPG, WEBP, or GIF.',
  allowFileUpload: true,
  validator: (_value, submission) => {
    return (
      (submission?.files.length ?? 0) > 0 ||
      'Upload at least one image to continue.'
    );
  },
  fileValidator: file => {
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed in the screenshot flow.';
    }

    return true;
  },
  onSuccess: (note, submission) => {
    const optionalNote = formatOptionalNote(note);
    const fileListLabel = listUploadedFileNames(submission.files);
    const responseText = optionalNote
      ? `Captured ${fileListLabel}. Your note was: "${optionalNote}". This flow shows uploaded screenshots as inline image parts in the transcript.`
      : `Captured ${fileListLabel}. This flow shows uploaded screenshots as inline image parts in the transcript.`;

    addAssistantTextMessage(responseText, createPrimaryButtons('screenshot'));
  },
});

const ATTACHMENT_BUTTON_DEF = createRequestInputButtonDef({
  initialLabel: 'Attach document',
  inputPromptMessage:
    'Upload a non-image support file such as a PDF invoice, CSV export, or text log.',
  placeholder: 'Optional note about what the attachment contains',
  inputDescription:
    'Non-image uploads render as downloadable `file` parts. Executables stay blocked in this demo.',
  allowFileUpload: true,
  validator: (_value, submission) => {
    return (
      (submission?.files.length ?? 0) > 0 ||
      'Upload at least one document to continue.'
    );
  },
  fileValidator: file => {
    if (file.type.startsWith('image/')) {
      return 'Use the screenshot flow for images.';
    }

    if (hasBlockedAttachmentExtension(file.name)) {
      return 'Executable attachments are blocked in this demo.';
    }

    return true;
  },
  onSuccess: (note, submission) => {
    const optionalNote = formatOptionalNote(note);
    const fileListLabel = listUploadedFileNames(submission.files);
    const responseText = optionalNote
      ? `Attached ${fileListLabel}. Your note was: "${optionalNote}". Non-image uploads appear as downloadable file parts in the transcript.`
      : `Attached ${fileListLabel}. Non-image uploads appear as downloadable file parts in the transcript.`;

    addAssistantTextMessage(responseText, createPrimaryButtons('attachment'));
  },
});

function createScreenshotButton(
  getFallbackButtons: () => readonly MessageButton[]
): MessageButton {
  return createButton(SCREENSHOT_BUTTON_DEF, {
    abortCallback: () => {
      addAssistantTextMessage(
        'Screenshot request cancelled. You can reopen it whenever you want to test image uploads again.',
        getFallbackButtons()
      );
    },
  });
}

function createAttachmentButton(
  getFallbackButtons: () => readonly MessageButton[]
): MessageButton {
  return createButton(ATTACHMENT_BUTTON_DEF, {
    abortCallback: () => {
      addAssistantTextMessage(
        'Document request cancelled. You can attach another file whenever you are ready.',
        getFallbackButtons()
      );
    },
  });
}

function createExplainButton(
  getFallbackButtons: () => readonly MessageButton[]
): MessageButton {
  return createButton({
    label: 'Explain message parts',
    onClick: () => {
      addAssistantMarkdownMessage(
        [
          '## Upload demo map',
          '',
          '- `Share screenshot` enables the upload button and accepts image files only.',
          '- `Attach document` enables the same upload button but validates for non-image files.',
          '- Uploaded screenshots render as inline `image` parts.',
          '- Uploaded documents render as downloadable `file` parts.',
          '- Outside these request-input flows, uploads stay disabled by default.',
        ].join('\n'),
        getFallbackButtons()
      );
    },
  });
}

function createPrimaryButtons(
  activeTopic?: UploadDemoTopic
): readonly MessageButton[] {
  const buttons: MessageButton[] = [];

  if (activeTopic !== 'screenshot') {
    buttons.push(
      createScreenshotButton(() => createPrimaryButtons(activeTopic))
    );
  }

  if (activeTopic !== 'attachment') {
    buttons.push(
      createAttachmentButton(() => createPrimaryButtons(activeTopic))
    );
  }

  if (activeTopic !== 'explain') {
    buttons.push(createExplainButton(() => createPrimaryButtons(activeTopic)));
  }

  return buttons;
}

function createInitialMessages(): readonly InputMessage[] {
  return [
    {
      id: 1,
      type: 'other',
      parts: [
        createMarkdownTextPart(
          [
            '## Upload Studio',
            '',
            'This example is dedicated to the optional upload button.',
            '',
            '- Use **Share screenshot** to test inline image parts.',
            '- Use **Attach document** to test downloadable file parts.',
            '- Both flows rely on `fileValidator` and keep uploads disabled outside the active request.',
          ].join('\n')
        ),
      ],
      timestamp: new Date(),
      buttons: createPrimaryButtons(),
    },
  ];
}

export function App(): React.JSX.Element {
  const initialMessages = useMemo(() => createInitialMessages(), []);

  return (
    <div className='uploads-demo'>
      <main className='uploads-demo__shell'>
        <header className='uploads-demo__header'>
          <p className='uploads-demo__eyebrow'>Uploads Example</p>
          <h1 className='uploads-demo__title'>
            A focused lab for file uploads.
          </h1>
          <p className='uploads-demo__description'>
            This demo keeps the rest of the library examples unchanged and puts
            the new upload behavior in one place. Use it to test inline image
            rendering, downloadable file parts, and per-file validation rules.
          </p>
          <ul className='uploads-demo__notes'>
            <li>Use Share screenshot for inline image parts.</li>
            <li>Use Attach document for downloadable file parts.</li>
            <li>
              Uploads stay hidden until a request-input flow enables them.
            </li>
          </ul>
        </header>

        <section className='uploads-demo__chat-frame'>
          <Chat
            initialMessages={initialMessages}
            theme={UPLOAD_THEME}
          />
        </section>
      </main>
    </div>
  );
}
