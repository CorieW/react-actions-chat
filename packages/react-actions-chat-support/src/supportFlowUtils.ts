import type {
  InputSubmission,
  InputValidationResult,
  InputValidator,
} from 'react-actions-chat';
import type {
  MaybePromise,
  SupportConfirmationButtonOverrides,
  SupportAgentIdentity,
  SupportInputValidationSettings,
  SupportLiveChatSession,
  SupportRequestInputButtonOverrides,
  SupportTextResolver,
  SupportTicket,
  SupportUserIdentity,
} from './supportFlowTypes';

interface ResolvedRequestInputButtonOverrides {
  readonly initialLabel?: string;
  readonly inputPromptMessage?: string;
  readonly placeholder?: string;
  readonly inputDescription?: string;
  readonly inputType?: SupportRequestInputButtonOverrides<unknown>['inputType'];
  readonly inputOptions?: SupportRequestInputButtonOverrides<unknown>['inputOptions'];
  readonly allowFileUpload?: boolean;
  readonly fileValidator?: SupportRequestInputButtonOverrides<unknown>['fileValidator'];
  readonly validator?: SupportRequestInputButtonOverrides<unknown>['validator'];
  readonly minMessageLength?: number;
  readonly minMessageLengthMessage?: string;
  readonly abortLabel?: string;
  readonly showAbort?: boolean;
  readonly shouldWaitForTurn?: boolean;
  readonly cooldownMs?: number;
  readonly cooldownMessage?: string;
  readonly inputTimeoutMs?: number;
  readonly inputTimeoutMessage?: string;
  readonly suppressValidationFailureMessage?: boolean;
  readonly variant?: SupportRequestInputButtonOverrides<unknown>['variant'];
  readonly className?: string;
  readonly style?: SupportRequestInputButtonOverrides<unknown>['style'];
  readonly rateLimit?: SupportRequestInputButtonOverrides<unknown>['rateLimit'];
}

interface ResolvedConfirmationButtonOverrides {
  readonly initialLabel?: string;
  readonly confirmationMessage?: string;
  readonly confirmLabel?: string;
  readonly rejectLabel?: string;
  readonly variant?: SupportConfirmationButtonOverrides<unknown>['variant'];
  readonly className?: string;
  readonly style?: SupportConfirmationButtonOverrides<unknown>['style'];
}

export function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function escapeMarkdown(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/([`*_{}[\]()#+!|>])/g, '\\$1');
}

export function formatTicketStatusLabel(
  status: SupportTicket['status']
): string {
  return status.replace('-', ' ');
}

export function formatLiveChatStatusLabel(
  status: SupportLiveChatSession['status']
): string {
  return status.replace('-', ' ');
}

export function joinMarkdownLines(
  lines: ReadonlyArray<string | undefined>
): string {
  return lines.filter((line): line is string => Boolean(line)).join('\n');
}

function formatTicketMessageAuthor(
  ticket: SupportTicket,
  message: SupportTicket['messages'][number]
): string {
  if (message.author === 'customer') {
    return (
      message.authorLabel ??
      ticket.customer.name ??
      ticket.customer.email ??
      'Customer'
    );
  }

  if (message.author === 'agent') {
    return message.authorLabel ?? 'Support agent';
  }

  return message.authorLabel ?? 'System';
}

export function formatTicketRecentActivity(
  ticket: SupportTicket,
  limit: number
): string | undefined {
  const recentMessages = ticket.messages.slice(-limit);

  if (!recentMessages.length) {
    return undefined;
  }

  return joinMarkdownLines([
    '### Recent activity',
    '',
    ...recentMessages.map(message => {
      return `- **${escapeMarkdown(formatTicketMessageAuthor(ticket, message))}** (${escapeMarkdown(formatTimestamp(message.createdAt))}): ${escapeMarkdown(message.body)}`;
    }),
    ticket.messages.length > limit
      ? `_Showing the ${limit} most recent updates._`
      : undefined,
  ]);
}

export function formatTicketFullActivity(ticket: SupportTicket): string {
  return joinMarkdownLines([
    `## Full activity for ${escapeMarkdown(ticket.reference)}`,
    '',
    ...ticket.messages.map(message => {
      return `- **${escapeMarkdown(formatTicketMessageAuthor(ticket, message))}** (${escapeMarkdown(formatTimestamp(message.createdAt))}): ${escapeMarkdown(message.body)}`;
    }),
  ]);
}

export function deriveAgentLabel(agent: SupportAgentIdentity): string {
  return agent.name ?? agent.email ?? 'Current agent';
}

export function deriveCustomerLabel(customer: SupportUserIdentity): string {
  return customer.name ?? customer.email ?? 'the customer';
}

export function normalizeReference(reference: string): string {
  return reference.trim().toUpperCase();
}

export function isOpenLiveChat(session: SupportLiveChatSession): boolean {
  return session.status === 'queued' || session.status === 'active';
}

export function isPromiseLike<T>(value: MaybePromise<T>): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}

function createTooShortMessage(minMessageLength: number): string {
  return `Please enter at least ${minMessageLength} character${minMessageLength === 1 ? '' : 's'}.`;
}

function createTooLongMessage(maxMessageLength: number): string {
  return `Please keep your message to ${maxMessageLength} character${maxMessageLength === 1 ? '' : 's'} or fewer.`;
}

export function resolveValidationSettings(
  defaults: SupportInputValidationSettings,
  override: SupportInputValidationSettings | undefined
): SupportInputValidationSettings {
  return {
    minMessageLength: override?.minMessageLength ?? defaults.minMessageLength,
    minMessageLengthMessage:
      override?.minMessageLengthMessage ?? defaults.minMessageLengthMessage,
    maxMessageLength: override?.maxMessageLength ?? defaults.maxMessageLength,
    maxMessageLengthMessage:
      override?.maxMessageLengthMessage ?? defaults.maxMessageLengthMessage,
    validator: override?.validator ?? defaults.validator,
  };
}

export function validateSupportInput(
  value: string,
  validation: SupportInputValidationSettings,
  submission?: InputSubmission
): InputValidationResult {
  const trimmedValue = value.trim();

  if (
    validation.minMessageLength !== undefined &&
    trimmedValue.length < validation.minMessageLength
  ) {
    return (
      validation.minMessageLengthMessage ??
      createTooShortMessage(validation.minMessageLength)
    );
  }

  if (
    validation.maxMessageLength !== undefined &&
    value.length > validation.maxMessageLength
  ) {
    return (
      validation.maxMessageLengthMessage ??
      createTooLongMessage(validation.maxMessageLength)
    );
  }

  return validation.validator?.(value, submission) ?? true;
}

export function createRequestInputValidator(
  validation: SupportInputValidationSettings
): InputValidator | undefined {
  if (
    validation.maxMessageLength === undefined &&
    validation.validator === undefined
  ) {
    return undefined;
  }

  return (value, submission) => {
    if (
      validation.maxMessageLength !== undefined &&
      value.length > validation.maxMessageLength
    ) {
      return (
        validation.maxMessageLengthMessage ??
        createTooLongMessage(validation.maxMessageLength)
      );
    }

    return validation.validator?.(value, submission) ?? true;
  };
}

function resolveSupportText<TContext>(
  resolver: SupportTextResolver<TContext> | undefined,
  context: TContext,
  fallback: string
): string {
  if (typeof resolver === 'function') {
    return resolver(context);
  }

  return resolver ?? fallback;
}

export function resolveRequestInputButtonOverrides<TContext>(
  overrides: SupportRequestInputButtonOverrides<TContext> | undefined,
  context: TContext
): ResolvedRequestInputButtonOverrides {
  if (!overrides) {
    return {};
  }

  return {
    ...(overrides.initialLabel !== undefined
      ? {
          initialLabel: resolveSupportText(overrides.initialLabel, context, ''),
        }
      : {}),
    ...(overrides.inputPromptMessage !== undefined
      ? {
          inputPromptMessage: resolveSupportText(
            overrides.inputPromptMessage,
            context,
            ''
          ),
        }
      : {}),
    ...(overrides.placeholder !== undefined
      ? { placeholder: resolveSupportText(overrides.placeholder, context, '') }
      : {}),
    ...(overrides.inputDescription !== undefined
      ? {
          inputDescription: resolveSupportText(
            overrides.inputDescription,
            context,
            ''
          ),
        }
      : {}),
    ...(overrides.inputType !== undefined
      ? { inputType: overrides.inputType }
      : {}),
    ...(overrides.inputOptions !== undefined
      ? { inputOptions: overrides.inputOptions }
      : {}),
    ...(overrides.allowFileUpload !== undefined
      ? { allowFileUpload: overrides.allowFileUpload }
      : {}),
    ...(overrides.fileValidator !== undefined
      ? { fileValidator: overrides.fileValidator }
      : {}),
    ...(overrides.validator !== undefined
      ? { validator: overrides.validator }
      : {}),
    ...(overrides.minMessageLength !== undefined
      ? { minMessageLength: overrides.minMessageLength }
      : {}),
    ...(overrides.minMessageLengthMessage !== undefined
      ? {
          minMessageLengthMessage: resolveSupportText(
            overrides.minMessageLengthMessage,
            context,
            ''
          ),
        }
      : {}),
    ...(overrides.abortLabel !== undefined
      ? { abortLabel: resolveSupportText(overrides.abortLabel, context, '') }
      : {}),
    ...(overrides.showAbort !== undefined
      ? { showAbort: overrides.showAbort }
      : {}),
    ...(overrides.shouldWaitForTurn !== undefined
      ? { shouldWaitForTurn: overrides.shouldWaitForTurn }
      : {}),
    ...(overrides.cooldownMs !== undefined
      ? { cooldownMs: overrides.cooldownMs }
      : {}),
    ...(overrides.cooldownMessage !== undefined
      ? {
          cooldownMessage: resolveSupportText(
            overrides.cooldownMessage,
            context,
            ''
          ),
        }
      : {}),
    ...(overrides.inputTimeoutMs !== undefined
      ? { inputTimeoutMs: overrides.inputTimeoutMs }
      : {}),
    ...(overrides.inputTimeoutMessage !== undefined
      ? {
          inputTimeoutMessage: resolveSupportText(
            overrides.inputTimeoutMessage,
            context,
            ''
          ),
        }
      : {}),
    ...(overrides.suppressValidationFailureMessage !== undefined
      ? {
          suppressValidationFailureMessage:
            overrides.suppressValidationFailureMessage,
        }
      : {}),
    ...(overrides.variant !== undefined ? { variant: overrides.variant } : {}),
    ...(overrides.className !== undefined
      ? { className: overrides.className }
      : {}),
    ...(overrides.style !== undefined ? { style: overrides.style } : {}),
    ...(overrides.rateLimit !== undefined
      ? { rateLimit: overrides.rateLimit }
      : {}),
  };
}

export function resolveConfirmationButtonOverrides<TContext>(
  overrides: SupportConfirmationButtonOverrides<TContext> | undefined,
  context: TContext
): ResolvedConfirmationButtonOverrides {
  if (!overrides) {
    return {};
  }

  return {
    ...(overrides.initialLabel !== undefined
      ? {
          initialLabel: resolveSupportText(overrides.initialLabel, context, ''),
        }
      : {}),
    ...(overrides.confirmationMessage !== undefined
      ? {
          confirmationMessage: resolveSupportText(
            overrides.confirmationMessage,
            context,
            ''
          ),
        }
      : {}),
    ...(overrides.confirmLabel !== undefined
      ? {
          confirmLabel: resolveSupportText(overrides.confirmLabel, context, ''),
        }
      : {}),
    ...(overrides.rejectLabel !== undefined
      ? { rejectLabel: resolveSupportText(overrides.rejectLabel, context, '') }
      : {}),
    ...(overrides.variant !== undefined ? { variant: overrides.variant } : {}),
    ...(overrides.className !== undefined
      ? { className: overrides.className }
      : {}),
    ...(overrides.style !== undefined ? { style: overrides.style } : {}),
  };
}
