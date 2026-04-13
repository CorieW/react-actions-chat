/**
 * Demo account records and helper functions used by the login example.
 *
 * The example stays fully local and deterministic so the auth flow is easy to
 * understand, test, and extend without wiring a real backend.
 */

/**
 * Demo account metadata used to drive the example sign-in flow.
 */
export interface DemoAccount {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
  readonly workspace: string;
  readonly role: string;
  readonly trustedDeviceLabel: string;
  readonly oneTimeCode?: string | undefined;
  readonly securityNote: string;
}

/**
 * Result returned after checking an email and password against the local demo
 * accounts.
 */
export type LoginAttemptResult =
  | {
      readonly kind: 'unknown-account';
    }
  | {
      readonly kind: 'invalid-password';
      readonly account: DemoAccount;
    }
  | {
      readonly kind: 'requires-one-time-code';
      readonly account: DemoAccount;
    }
  | {
      readonly kind: 'success';
      readonly account: DemoAccount;
    };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ONE_TIME_CODE_PATTERN = /^\d{6}$/;

/**
 * Demo accounts shown in the example side panel.
 */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    fullName: 'Alex Chen',
    email: 'alex@northstar.app',
    password: 'Northstar!24',
    workspace: 'Northstar Ops',
    role: 'Operations Lead',
    trustedDeviceLabel: 'London MacBook Pro',
    oneTimeCode: '246810',
    securityNote: 'Requires a one-time code after password entry.',
  },
  {
    fullName: 'Sam Rivera',
    email: 'sam@northstar.app',
    password: 'Support!2026',
    workspace: 'Care Desk',
    role: 'Support Manager',
    trustedDeviceLabel: 'Berlin support terminal',
    securityNote: 'Standard email and password flow.',
  },
  {
    fullName: 'Maya Patel',
    email: 'maya@northstar.app',
    password: 'Launchpad#42',
    workspace: 'Launchpad Studio',
    role: 'Product Designer',
    trustedDeviceLabel: 'Remote iPad session',
    securityNote: 'Good for testing a new-device login path.',
  },
] as const;

/**
 * Normalizes an email before matching it against the demo accounts.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Checks whether a value looks like a valid email address.
 */
export function isValidEmailAddress(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

/**
 * Finds a demo account by email address.
 */
export function findDemoAccount(email: string): DemoAccount | undefined {
  const normalizedEmail = normalizeEmail(email);

  return DEMO_ACCOUNTS.find(account => account.email === normalizedEmail);
}

/**
 * Validates a demo login attempt.
 */
export function attemptDemoLogin(
  email: string,
  password: string
): LoginAttemptResult {
  const account = findDemoAccount(email);
  if (!account) {
    return {
      kind: 'unknown-account',
    };
  }

  if (account.password !== password.trim()) {
    return {
      kind: 'invalid-password',
      account,
    };
  }

  if (account.oneTimeCode) {
    return {
      kind: 'requires-one-time-code',
      account,
    };
  }

  return {
    kind: 'success',
    account,
  };
}

/**
 * Verifies the demo one-time code for an account.
 */
export function verifyOneTimeCode(email: string, code: string): boolean {
  const account = findDemoAccount(email);
  if (!account?.oneTimeCode) {
    return false;
  }

  const normalizedCode = code.trim();
  return (
    ONE_TIME_CODE_PATTERN.test(normalizedCode) &&
    normalizedCode === account.oneTimeCode
  );
}

/**
 * Masks the local part of an email to mimic a production challenge screen.
 */
export function maskEmailAddress(email: string): string {
  const normalizedEmail = normalizeEmail(email);
  const [localPart, domain] = normalizedEmail.split('@');

  if (!localPart || !domain) {
    return email.trim();
  }

  const visiblePrefix = localPart.slice(0, 2);
  const hiddenLength = Math.min(Math.max(localPart.length - 2, 1), 4);

  return `${visiblePrefix}${'*'.repeat(hiddenLength)}@${domain}`;
}
