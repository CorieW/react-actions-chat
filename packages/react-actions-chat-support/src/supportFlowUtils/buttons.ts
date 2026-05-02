import { createButton, type MessageButton } from 'react-actions-chat';
import type {
  SupportConfirmationButtonOverrides,
  SupportListFilterOption,
  SupportRequestInputButtonOverrides,
  SupportTextResolver,
} from '../supportFlowTypes';

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

export function withPersistentButtonIds(
  buttons: readonly MessageButton[],
  idPrefix: string
): readonly (MessageButton & { readonly id: string })[] {
  return buttons.map((button, index) => {
    const explicitId = (button as MessageButton & { readonly id?: string }).id;
    return {
      ...button,
      id: explicitId ?? `${idPrefix}-${index}`,
    };
  });
}

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

interface CreateListFilterButtonsOptions<
  TOption extends SupportListFilterOption,
> {
  readonly filterOptions: readonly TOption[];
  readonly activeFilterId: string | undefined;
  readonly showFilter: (filterId: string) => void;
  readonly abortFilter?: (() => void) | undefined;
}

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
