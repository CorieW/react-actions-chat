import { useRef } from 'react';
import type {
  ChatTheme,
  InputMessage,
  MessageButton,
} from 'react-actions-chat';
import {
  Chat,
  createButton,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  useChatStore,
  useInputFieldStore,
} from 'react-actions-chat';
import {
  DEMO_ACCOUNTS,
  attemptDemoLogin,
  findDemoAccount,
  isValidEmailAddress,
  maskEmailAddress,
  normalizeEmail,
  type DemoAccount,
  verifyOneTimeCode,
} from './loginDemo';

const LOGIN_THEME: ChatTheme = {
  primaryColor: '#0f766e',
  secondaryColor: '#e6f3ee',
  backgroundColor: '#fffaf3',
  textColor: '#17302d',
  borderColor: '#d4e4dc',
  inputBackgroundColor: '#fffdf8',
  inputTextColor: '#17302d',
  buttonColor: '#145c52',
  buttonTextColor: '#f8faf9',
};

const EMAIL_SIGN_IN_BUTTON_DEF = createRequestInputButtonDef({
  initialLabel: 'Sign in with email',
  inputPromptMessage: 'Enter your work email and I will open the sign-in flow.',
  inputType: 'email',
  placeholder: 'you@northstar.app',
  inputDescription:
    'Try alex@northstar.app, sam@northstar.app, or maya@northstar.app.',
  validator: value => {
    if (!isValidEmailAddress(value)) {
      return 'Please enter a valid email address.';
    }

    return true;
  },
});

const RESET_PASSWORD_BUTTON_DEF = createRequestInputButtonDef({
  initialLabel: 'Reset password',
  inputPromptMessage: 'Enter the email address that needs a reset link.',
  inputType: 'email',
  placeholder: 'you@northstar.app',
  inputDescription:
    'This demo stays local, but it shows where account recovery would begin.',
  validator: value => {
    if (!isValidEmailAddress(value)) {
      return 'Please enter a valid email address.';
    }

    return true;
  },
});

const SIGN_OUT_BUTTON_DEF = createRequestConfirmationButtonDef({
  initialLabel: 'Sign out',
  confirmationMessage:
    'End this demo session and return to the sign-in assistant?',
  confirmLabel: 'Sign out',
  rejectLabel: 'Stay signed in',
  variant: 'warning',
});

type LoginStage = 'idle' | 'awaiting-password' | 'awaiting-one-time-code';

interface LoginFlowState {
  readonly stage: LoginStage;
  readonly account?: DemoAccount | undefined;
  readonly passwordAttempts: number;
}

/**
 * Returns the raw value from the latest user-authored message so password and
 * one-time code steps can read the real submission instead of the masked text
 * shown in the transcript.
 */
function getLatestUserRawMessage(): string | undefined {
  const messages = useChatStore.getState().getMessages();
  const lastSelfMessage = [...messages]
    .reverse()
    .find(message => message.type === 'self');

  return lastSelfMessage?.rawContent;
}

/**
 * Login example with a richer multi-step demo flow.
 */
export function App(): React.JSX.Element {
  const initialMessagesRef = useRef<readonly InputMessage[] | null>(null);
  const flowStateRef = useRef<LoginFlowState>({
    stage: 'idle',
    passwordAttempts: 0,
  });

  function resetSharedInputField(): void {
    const inputFieldStore = useInputFieldStore.getState();
    inputFieldStore.resetInputFieldType();
    inputFieldStore.resetInputFieldPlaceholder();
    inputFieldStore.resetInputFieldDescription();
    inputFieldStore.resetInputFieldValidator();
    inputFieldStore.resetInputFieldValue();
  }

  function clearFlowState(): void {
    flowStateRef.current = {
      stage: 'idle',
      passwordAttempts: 0,
    };
    resetSharedInputField();
  }

  function createPrimaryButtons(): readonly MessageButton[] {
    return [
      createButton(EMAIL_SIGN_IN_BUTTON_DEF, {
        onValidInput: beginEmailSignIn,
      }),
      createButton(RESET_PASSWORD_BUTTON_DEF, {
        onValidInput: handlePasswordReset,
      }),
    ];
  }

  function createRecoveryButtons(): readonly MessageButton[] {
    return [
      createButton(RESET_PASSWORD_BUTTON_DEF, {
        onValidInput: handlePasswordReset,
      }),
    ];
  }

  function createAuthenticatedButtons(
    account: DemoAccount
  ): readonly MessageButton[] {
    return [
      createButton({
        label: 'Session details',
        onClick: () => {
          useChatStore.getState().addMessage({
            type: 'other',
            content: `${account.fullName} is signed in as ${account.role}. The active workspace is ${account.workspace}, and this device is recorded as ${account.trustedDeviceLabel}.`,
            buttons: createAuthenticatedButtons(account),
          });
        },
      }),
      createButton({
        label: 'Security tips',
        onClick: () => {
          useChatStore.getState().addMessage({
            type: 'other',
            content:
              'This example reuses one shared chat input for email, password, recovery, and challenge codes. In a production app, those steps would call secure backend APIs instead of local demo helpers.',
            buttons: createAuthenticatedButtons(account),
          });
        },
      }),
      createButton(SIGN_OUT_BUTTON_DEF, {
        onConfirm: handleSignOut,
        onReject: () => {
          useChatStore.getState().addMessage({
            type: 'other',
            content: 'No problem. Your demo session is still active.',
            buttons: createAuthenticatedButtons(account),
          });
        },
      }),
    ];
  }

  function handleMissingAccount(email: string): void {
    clearFlowState();

    useChatStore.getState().addMessage({
      type: 'other',
      content: `I could not find a demo workspace for ${normalizeEmail(email)}. Try one of the sample accounts or start a password reset flow.`,
      buttons: createPrimaryButtons(),
    });
  }

  function beginEmailSignIn(email: string): void {
    const account = findDemoAccount(email);
    if (!account) {
      handleMissingAccount(email);
      return;
    }

    flowStateRef.current = {
      stage: 'awaiting-password',
      account,
      passwordAttempts: 0,
    };

    const inputFieldStore = useInputFieldStore.getState();
    inputFieldStore.setInputFieldType('password');
    inputFieldStore.setInputFieldPlaceholder('Enter your password');
    inputFieldStore.setInputFieldDescription(
      `Use ${account.password} for the ${account.workspace} demo account.`
    );
    inputFieldStore.setInputFieldValidator(value => {
      if (value.trim() === '') {
        return 'Enter your password to continue.';
      }

      return true;
    });

    useChatStore.getState().addMessage({
      type: 'other',
      content: account.oneTimeCode
        ? `Welcome back, ${account.fullName}. Enter the password for ${account.workspace}. I will ask for a one-time code after that step.`
        : `Welcome back, ${account.fullName}. Enter the password for ${account.workspace} to continue.`,
      userResponseCallback: handlePasswordReply,
      buttons: createRecoveryButtons(),
    });
  }

  function showOneTimeCodePrompt(
    account: DemoAccount,
    isResend: boolean = false
  ): void {
    flowStateRef.current = {
      stage: 'awaiting-one-time-code',
      account,
      passwordAttempts: 0,
    };

    const inputFieldStore = useInputFieldStore.getState();
    inputFieldStore.setInputFieldType('text');
    inputFieldStore.setInputFieldPlaceholder('246810');
    inputFieldStore.setInputFieldDescription(
      `Enter the 6-digit challenge code for ${maskEmailAddress(account.email)}.`
    );
    inputFieldStore.setInputFieldValidator(value => {
      if (!/^\d{6}$/.test(value.trim())) {
        return 'Enter the 6-digit verification code.';
      }

      return true;
    });

    useChatStore.getState().addMessage({
      type: 'other',
      content: isResend
        ? `I sent a fresh code to ${maskEmailAddress(account.email)}. For this demo, enter ${account.oneTimeCode}.`
        : `Password verified. Enter the 6-digit code sent to ${maskEmailAddress(account.email)}. For this demo, use ${account.oneTimeCode}.`,
      userResponseCallback: handleOneTimeCodeReply,
      buttons: [
        createButton({
          label: 'Resend code',
          onClick: () => {
            showOneTimeCodePrompt(account, true);
          },
        }),
      ],
    });
  }

  function completeLogin(account: DemoAccount): void {
    clearFlowState();

    useChatStore.getState().addMessage({
      type: 'other',
      content: `You are in. ${account.workspace} is ready for ${account.fullName}, and ${account.trustedDeviceLabel} is now marked as trusted for the next 30 days.`,
      buttons: createAuthenticatedButtons(account),
    });
  }

  function handlePasswordReply(): void {
    const currentFlow = flowStateRef.current;
    const submittedPassword = getLatestUserRawMessage();

    if (
      currentFlow.stage !== 'awaiting-password' ||
      !currentFlow.account ||
      submittedPassword === undefined
    ) {
      return;
    }

    const loginResult = attemptDemoLogin(
      currentFlow.account.email,
      submittedPassword
    );

    if (loginResult.kind === 'unknown-account') {
      handleMissingAccount(currentFlow.account.email);
      return;
    }

    if (loginResult.kind === 'invalid-password') {
      const nextAttemptCount = currentFlow.passwordAttempts + 1;
      flowStateRef.current = {
        ...currentFlow,
        passwordAttempts: nextAttemptCount,
      };

      useChatStore.getState().addMessage({
        type: 'other',
        content:
          nextAttemptCount === 1
            ? `That password did not match ${loginResult.account.email}. For this demo, use ${loginResult.account.password}.`
            : `Still no match. Use ${loginResult.account.password}, switch accounts, or trigger a password reset.`,
        userResponseCallback: handlePasswordReply,
        buttons: createRecoveryButtons(),
      });
      return;
    }

    if (loginResult.kind === 'requires-one-time-code') {
      showOneTimeCodePrompt(loginResult.account);
      return;
    }

    completeLogin(loginResult.account);
  }

  function handleOneTimeCodeReply(): void {
    const currentFlow = flowStateRef.current;
    const submittedCode = getLatestUserRawMessage();

    if (
      currentFlow.stage !== 'awaiting-one-time-code' ||
      !currentFlow.account ||
      submittedCode === undefined
    ) {
      return;
    }

    const account = currentFlow.account;

    if (!verifyOneTimeCode(account.email, submittedCode)) {
      useChatStore.getState().addMessage({
        type: 'other',
        content: `That code did not match. Re-enter ${account.oneTimeCode} for the demo or resend the challenge.`,
        userResponseCallback: handleOneTimeCodeReply,
        buttons: [
          createButton({
            label: 'Resend code',
            onClick: () => {
              showOneTimeCodePrompt(account, true);
            },
          }),
        ],
      });
      return;
    }

    completeLogin(currentFlow.account);
  }

  function handlePasswordReset(email: string): void {
    const normalizedEmail = normalizeEmail(email);
    const account = findDemoAccount(normalizedEmail);

    clearFlowState();

    useChatStore.getState().addMessage({
      type: 'other',
      content: account
        ? `Password recovery started for ${normalizedEmail}. No real email is sent in this demo, but this is where you would deliver a secure reset link. When you are ready, sign in with ${account.password}.`
        : `If ${normalizedEmail} belongs to a workspace, a password reset email is on the way. Since this is a local demo, you can use one of the sample accounts to keep exploring.`,
      buttons: createPrimaryButtons(),
    });
  }

  function handleSignOut(): void {
    clearFlowState();

    useChatStore.getState().addMessage({
      type: 'other',
      content:
        'You are signed out. Start another sign-in flow, try a different demo account, or test password recovery.',
      buttons: createPrimaryButtons(),
    });
  }

  if (initialMessagesRef.current === null) {
    initialMessagesRef.current = [
      {
        id: 1,
        type: 'other',
        content:
          'Welcome to Northstar Secure. This example walks through email sign-in, password handling, password recovery, and an optional verification-code challenge using the shared chat input.',
        timestamp: new Date(),
        buttons: createPrimaryButtons(),
      },
    ];
  }

  return (
    <div className='login-example-page'>
      <aside className='login-example-panel'>
        <p className='login-example-eyebrow'>Secure sign-in demo</p>
        <h1 className='login-example-title'>Northstar Secure</h1>
        <p className='login-example-copy'>
          A more polished login example for react-actions-chat, with multi-step
          auth, recovery states, and deterministic demo data.
        </p>

        <section className='login-example-section'>
          <h2>Demo accounts</h2>
          <div className='login-example-account-list'>
            {DEMO_ACCOUNTS.map(account => (
              <article
                key={account.email}
                className='login-example-account-card'
              >
                <div className='login-example-account-header'>
                  <strong>{account.fullName}</strong>
                  <span>{account.role}</span>
                </div>
                <p>{account.workspace}</p>
                <code>{account.email}</code>
                <code>{account.password}</code>
                {account.oneTimeCode ? (
                  <code>{account.oneTimeCode}</code>
                ) : null}
                <small>{account.securityNote}</small>
              </article>
            ))}
          </div>
        </section>

        <section className='login-example-section'>
          <h2>Why it is better</h2>
          <ul className='login-example-checklist'>
            <li>Uses raw input values for password and code verification.</li>
            <li>Shows happy path, recovery path, and MFA path in one flow.</li>
            <li>Keeps the example fully local so it is easy to understand.</li>
          </ul>
        </section>
      </aside>

      <main className='login-example-chat'>
        <Chat
          initialMessages={initialMessagesRef.current}
          theme={LOGIN_THEME}
        />
      </main>
    </div>
  );
}
