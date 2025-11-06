import type { Message } from './js/types';
import {
  Chat,
  createRequestConfirmationButton,
  createRequestInputButton,
} from './components';
import { useChatStore } from './lib/chatStore';
import { useMemo } from 'react';
import { useInputFieldStore } from './lib';

function App(): React.JSX.Element {
  const { addMessage } = useChatStore();
  const { setInputFieldDescription } = useInputFieldStore();

  const repeatMsg = (content: string) => {
    addMessage({
      type: 'other',
      content: content,
      userResponseCallback: () => repeatMsg(content),
    });
  };

  // Memoize initial messages so the userResponseCallback is stable and doesn't retrigger on every render,
  // and avoids calling useChatStore inside the callback directly (prevents update depth errors)
  const INITIAL_MESSAGES: readonly Message[] = useMemo(
    () => [
      {
        id: 1,
        type: 'other',
        content: 'Hello! How can I help you today?',
        timestamp: new Date(),
        userResponseCallback: () => {
          setInputFieldDescription("We're not available at the moment");
        },
        buttons: [
          {
            label: 'Get help',
            style: {
              backgroundColor: 'transparent',
              border: '2px solid #3b82f6',
              color: '#3b82f6',
            },
            onClick: () => {
              addMessage({
                type: 'other',
                content: 'I can help you with that!',
              });
            },
          },
          createRequestConfirmationButton({
            initialLabel: 'Delete Account',
            confirmationMessage:
              'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
            variant: 'error',
            onConfirm: () => {
              addMessage({
                type: 'other',
                content: 'Your account has been deleted successfully.',
              });
            },
            onReject: () => {
              addMessage({
                type: 'other',
                content:
                  'Account deletion cancelled. Your account remains active.',
              });
            },
          }),
          createRequestInputButton({
            initialLabel: 'Update Email',
            inputPromptMessage: 'Please enter your new email address:',
            inputType: 'email',
            placeholder: 'your.email@example.com',
            inputDescription:
              'We will send a verification email to this address',
            validator: value => {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
              }
              return true;
            },
            onInput: email => {
              addMessage({
                type: 'other',
                content: `Email updated successfully! We sent a verification email to ${email}.`,
              });
            },
          }),
          createRequestInputButton({
            initialLabel: 'Change Password',
            inputPromptMessage: 'Please enter your new password:',
            inputType: 'password',
            placeholder: 'Enter password',
            inputDescription: 'Password must be at least 8 characters long',
            validator: value => {
              if (value.length < 8) {
                return 'Password must be at least 8 characters long';
              }
              if (!/[A-Z]/.test(value)) {
                return 'Password must contain at least one uppercase letter';
              }
              if (!/[a-z]/.test(value)) {
                return 'Password must contain at least one lowercase letter';
              }
              if (!/[0-9]/.test(value)) {
                return 'Password must contain at least one number';
              }
              return true;
            },
            onInput: () => {
              addMessage({
                type: 'other',
                content: 'Password changed successfully!',
              });
            },
          }),
        ],
      },
    ],
    [addMessage]
  );

  return (
    <div className='min-h-screen bg-background'>
      <Chat initialMessages={INITIAL_MESSAGES} theme='dark' />
    </div>
  );
}

export default App;
