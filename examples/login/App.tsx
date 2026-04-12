import { useMemo } from 'react';
import type { InputMessage } from 'actionable-support-chat';
import {
  Chat,
  createButton,
  createRequestInputButtonDef,
  useChatStore,
  useInputFieldStore,
} from 'actionable-support-chat';

/**
 * Login Example
 *
 * This example demonstrates a login flow using email and password inputs.
 * The bot guides users through entering their credentials step by step.
 */
const LOGIN_WITH_EMAIL_BUTTON_DEF = createRequestInputButtonDef({
  initialLabel: 'Login with Email',
  inputPromptMessage: 'Please enter your email address:',
  inputType: 'email',
  placeholder: 'your.email@example.com',
  inputDescription: 'We will use this email to log you in',
  validator: value => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return true;
  },
});

export function App(): React.JSX.Element {
  const { addMessage } = useChatStore();
  const {
    setInputFieldType,
    setInputFieldPlaceholder,
    setInputFieldDescription,
    setInputFieldValidator,
    resetInputFieldType,
    resetInputFieldPlaceholder,
    resetInputFieldDescription,
    resetInputFieldValidator,
  } = useInputFieldStore();

  // Simulate login validation - in a real app, this would call an API
  const handleLogin = (email: string, password: string): void => {
    // Basic validation
    if (!email || !password) {
      addMessage({
        type: 'other',
        content: 'Please provide both email and password.',
      });
      return;
    }

    // Reset input field back to normal
    resetInputFieldType();
    resetInputFieldPlaceholder();
    resetInputFieldDescription();
    resetInputFieldValidator();

    // Simulate successful login
    addMessage({
      type: 'other',
      content: `Welcome back! You've successfully logged in with ${email}.`,
    });
  };

  // Handle email input
  const handleEmailInput = (email: string): void => {
    // Email is valid, now request password
    // Configure the input field for password
    setInputFieldType('password');
    setInputFieldPlaceholder('Enter your password');
    setInputFieldDescription('Your password will be kept secure');
    setInputFieldValidator(value => {
      if (value.length < 6) {
        return 'Password must be at least 6 characters long';
      }
      return true;
    });

    addMessage({
      type: 'other',
      content: 'Great! Now please enter your password.',
      userResponseCallback: () => {
        const messages = useChatStore.getState().getMessages();
        const lastSelfMessage = [...messages]
          .reverse()
          .find(msg => msg.type === 'self');
        if (lastSelfMessage) {
          handleLogin(email, lastSelfMessage.content);
        }
      },
    });
  };

  const INITIAL_MESSAGES: readonly InputMessage[] = useMemo(
    () => [
      {
        id: 1,
        type: 'other',
        content: 'Welcome! Please log in to continue.',
        timestamp: new Date(),
        buttons: [
          createButton(LOGIN_WITH_EMAIL_BUTTON_DEF, {
            onValidInput: handleEmailInput,
          }),
        ],
      },
    ],
    []
  );

  return (
    <div className='bg-background min-h-screen'>
      <Chat
        initialMessages={INITIAL_MESSAGES}
        theme='dark'
      />
    </div>
  );
}
