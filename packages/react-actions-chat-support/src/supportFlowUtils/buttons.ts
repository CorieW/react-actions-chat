import { createButton, type MessageButton } from 'react-actions-chat';
import type {
  SupportConfirmationButtonOverrides,
  SupportListFilterOption,
  SupportRequestInputButtonOverrides,
  SupportTextResolver,
} from '../supportFlowTypes';

/**
 * Concrete request-input button overrides after text resolvers have run.
 */
interface ResolvedRequestInputButtonOverrides {
  /**
   * Label shown for the initial action.
   */
  readonly initialLabel?: string;
  /**
   * Prompt message shown before collecting request input.
   */
  readonly inputPromptMessage?: string;
  /**
   * Placeholder text shown by the input.
   */
  readonly placeholder?: string;
  /**
   * Description shown alongside the request input.
   */
  readonly inputDescription?: string;
  /**
   * Input mode used when collecting user input.
   */
  readonly inputType?: SupportRequestInputButtonOverrides<unknown>['inputType'];
  /**
   * Select options shown by the request input.
   */
  readonly inputOptions?: SupportRequestInputButtonOverrides<unknown>['inputOptions'];
  /**
   * Whether file uploads are allowed for the input.
   */
  readonly allowFileUpload?: boolean;
  /**
   * Validator applied to uploaded files.
   */
  readonly fileValidator?: SupportRequestInputButtonOverrides<unknown>['fileValidator'];
  /**
   * Validator applied to text submissions.
   */
  readonly validator?: SupportRequestInputButtonOverrides<unknown>['validator'];
  /**
   * Minimum number of characters required for submission.
   */
  readonly minMessageLength?: number;
  /**
   * Validation message shown when the submission is too short.
   */
  readonly minMessageLengthMessage?: string;
  /**
   * Label shown for the abort action.
   */
  readonly abortLabel?: string;
  /**
   * Whether the abort action is shown while collecting input.
   */
  readonly showAbort?: boolean;
  /**
   * Whether submissions wait for the current assistant turn to finish.
   */
  readonly shouldWaitForTurn?: boolean;
  /**
   * Cooldown duration in milliseconds before another submission is allowed.
   */
  readonly cooldownMs?: number;
  /**
   * Message shown while the input is in cooldown.
   */
  readonly cooldownMessage?: string;
  /**
   * Timeout in milliseconds before the request input expires.
   */
  readonly inputTimeoutMs?: number;
  /**
   * Message shown when the input times out.
   */
  readonly inputTimeoutMessage?: string;
  /**
   * Whether validation failure messages are suppressed.
   */
  readonly suppressValidationFailureMessage?: boolean;
  /**
   * Visual variant used when rendering the button.
   */
  readonly variant?: SupportRequestInputButtonOverrides<unknown>['variant'];
  /**
   * Additional class name applied to the rendered element.
   */
  readonly className?: string;
  /**
   * Inline styles applied to the rendered element.
   */
  readonly style?: SupportRequestInputButtonOverrides<unknown>['style'];
  /**
   * Rate-limit settings applied to request-input submissions.
   */
  readonly rateLimit?: SupportRequestInputButtonOverrides<unknown>['rateLimit'];
}

/**
 * Concrete confirmation button overrides after text resolvers have run.
 */
interface ResolvedConfirmationButtonOverrides {
  /**
   * Label shown for the initial action.
   */
  readonly initialLabel?: string;
  /**
   * Message shown before asking the user to confirm the action.
   */
  readonly confirmationMessage?: string;
  /**
   * Label shown for the confirm action.
   */
  readonly confirmLabel?: string;
  /**
   * Label shown for the reject action.
   */
  readonly rejectLabel?: string;
  /**
   * Visual variant used when rendering the button.
   */
  readonly variant?: SupportConfirmationButtonOverrides<unknown>['variant'];
  /**
   * Additional class name applied to the rendered element.
   */
  readonly className?: string;
  /**
   * Inline styles applied to the rendered element.
   */
  readonly style?: SupportConfirmationButtonOverrides<unknown>['style'];
}

/**
 * Resolves support text from caller configuration and defaults.
 *
 * @param resolver - Text resolver to evaluate.
 * @param context - Context object available to this resolver.
 * @param fallback - Fallback text used when no resolver value is provided.
 */
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

/**
 * Resolves request input button overrides from caller configuration and defaults.
 *
 * @param overrides - Caller-provided button overrides to resolve.
 * @param context - Context object available to this resolver.
 */
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

/**
 * Resolves confirmation button overrides from caller configuration and defaults.
 *
 * @param overrides - Caller-provided button overrides to resolve.
 * @param context - Context object available to this resolver.
 */
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

/**
 * Returns persistent button ids applied to the provided value.
 *
 * @param buttons - Buttons to transform, render, or customize.
 * @param idPrefix - Prefix used when generating missing persistent button IDs.
 */
export function withPersistentButtonIds(
  buttons: readonly MessageButton[],
  idPrefix: string
): readonly (MessageButton & {
  /**
   * Stable identifier for this value.
   */
  readonly id: string;
})[] {
  return buttons.map((button, index) => {
    const explicitId = (
      button as MessageButton & {
        /**
         * Stable identifier for this value.
         */
        readonly id?: string;
      }
    ).id;
    return {
      ...button,
      id: explicitId ?? `${idPrefix}-${index}`,
    };
  });
}

/**
 * Resolves active list filter from caller configuration and defaults.
 *
 * @param filterOptions - Available filter options for the list.
 * @param activeFilterId - Identifier of the filter that should be treated as active.
 */
export function resolveActiveListFilter<
  TOption extends SupportListFilterOption,
>(
  filterOptions: readonly TOption[],
  activeFilterId: string | undefined
): TOption | undefined {
  if (!filterOptions.length) {
    return undefined;
  }

  return (
    filterOptions.find(option => option.id === activeFilterId) ??
    filterOptions.find(option => option.isDefault) ??
    filterOptions[0]
  );
}

/**
 * Options used to create list filter buttons.
 */
interface CreateListFilterButtonsOptions<
  TOption extends SupportListFilterOption,
> {
  /**
   * Filter options available for the current list.
   */
  readonly filterOptions: readonly TOption[];
  /**
   * Identifier for the currently selected filter option.
   */
  readonly activeFilterId: string | undefined;
  /**
   * Shows the list for a selected filter.
   *
   * @param filterId - Identifier of the filter to show.
   */
  readonly showFilter: (filterId: string) => void;
  /**
   * Optional filter ID that should be rendered as an abort action.
   */
  readonly abortFilter?: (() => void) | undefined;
}

/**
 * Creates list filter buttons.
 *
 * @param options - Options for creating the list filter buttons.
 */
export function createListFilterButtons<
  TOption extends SupportListFilterOption,
>({
  filterOptions,
  activeFilterId,
  showFilter,
  abortFilter,
}: CreateListFilterButtonsOptions<TOption>): readonly MessageButton[] {
  if (!filterOptions.length) {
    return [];
  }

  const activeFilter = resolveActiveListFilter(filterOptions, activeFilterId);

  return [
    createButton(
      {
        kind: 'request-input',
        initialLabel: `Filter: ${activeFilter?.label ?? 'Select'}`,
        inputPromptMessage: 'Choose a filter.',
        placeholder: 'Select filter',
        inputType: 'select',
        inputOptions: filterOptions.map(option => {
          return {
            value: option.id,
            label: option.label,
          };
        }),
        showAbort: true,
        variant: activeFilter?.activeVariant ?? activeFilter?.variant ?? 'info',
        className: activeFilter?.className,
        style: activeFilter?.style,
      },
      {
        ...(abortFilter ? { abortCallback: abortFilter } : {}),
        onValidInput: filterId => {
          if (filterOptions.some(option => option.id === filterId)) {
            showFilter(filterId);
          }
        },
      }
    ),
  ];
}
