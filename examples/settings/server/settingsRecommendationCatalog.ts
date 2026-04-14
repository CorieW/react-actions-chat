import type { VectorSearchButtonDefinition } from 'react-actions-chat-recommended-actions';

export type SettingsRecommendationActionId =
  | 'email'
  | 'password'
  | 'display-name'
  | 'phone-number'
  | 'two-factor-auth'
  | 'logout'
  | 'delete-account';

/**
 * Serializable search documents used by the settings example backend
 * recommendation flow.
 */
export const SETTINGS_RECOMMENDATION_DOCUMENTS: readonly VectorSearchButtonDefinition<{
  readonly id: SettingsRecommendationActionId;
  readonly label: string;
}>[] = [
  {
    id: 'email',
    label: 'Change Email',
    description:
      'Update the email address on the account and send a verification email to the new address.',
    exampleQueries: [
      'change my email',
      'update my email address',
      'use a different email',
      'fix the email on my account',
      'replace the email linked to my account',
    ],
  },
  {
    id: 'password',
    label: 'Change Password',
    description:
      'Reset or change the account password to improve account security and sign-in access.',
    exampleQueries: [
      'change my password',
      'reset my password',
      'I forgot my password',
      'secure my login',
      'I cannot sign in with my password',
    ],
  },
  {
    id: 'display-name',
    label: 'Update Display Name',
    description:
      'Update the profile display name shown in the account and support notifications.',
    exampleQueries: [
      'change my display name',
      'update my profile name',
      'rename my account',
      'use a different name',
      'edit the name on my profile',
    ],
  },
  {
    id: 'phone-number',
    label: 'Update Phone Number',
    description:
      'Update the phone number used for account recovery and verification codes.',
    exampleQueries: [
      'change my phone number',
      'update my mobile number',
      'use a different phone for verification',
      'fix my recovery number',
      'replace the phone on my account',
    ],
  },
  {
    id: 'two-factor-auth',
    label: 'Enable Two-Factor Authentication',
    description:
      'Enable two-factor authentication to make account sign-in more secure.',
    exampleQueries: [
      'turn on two-factor authentication',
      'enable 2fa',
      'make my login more secure',
      'add verification codes to sign in',
      'set up extra login security',
    ],
  },
  {
    id: 'logout',
    label: 'Logout',
    description:
      'Sign out of the current account and end the active session on this device.',
    exampleQueries: [
      'log me out',
      'sign me out',
      'I want to get out of my account',
      'end my session',
      'leave this account',
    ],
  },
  {
    id: 'delete-account',
    label: 'Delete Account',
    description:
      'Delete the current account and start the account removal flow.',
    exampleQueries: [
      'delete my account',
      'close my account',
      'remove my profile',
      'erase this account',
      'permanently delete everything',
    ],
  },
] as const;
