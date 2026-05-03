import type { SupportLiveChatSession } from '../../supportFlowTypes';
import type {
  SupportUserFlowConfig,
  SupportUserFormatterContext,
  SupportUserLiveChatFormatterContext,
} from '../types';
import { formatLiveChatDetails, formatLiveChatEnded } from './formatters';

/**
 * Options used to create user live chat formatters.
 */
interface CreateUserLiveChatFormattersOptions {
  /**
   * Flow or component configuration for this contract.
   */
  readonly config: SupportUserFlowConfig;
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportUserFormatterContext;
}

/**
 * Formatter overrides for messages produced by the user live chat.
 */
interface UserLiveChatFormatters {
  /**
   * Formats user live chat details.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly formatUserLiveChatDetails: (
    session: SupportLiveChatSession
  ) => string;
  /**
   * Formats user live chat ended.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly formatUserLiveChatEnded: (session: SupportLiveChatSession) => string;
}

/**
 * Formatter overrides for messages produced by the customer live chat flow.
 *
 * @param options - Options for creating the user live chat formatters.
 */
export function createUserLiveChatFormatters({
  config,
  formatterContext,
}: CreateUserLiveChatFormattersOptions): UserLiveChatFormatters {
  const formatUserLiveChatDetails = (
    session: SupportLiveChatSession
  ): string => {
    const context: SupportUserLiveChatFormatterContext = {
      ...formatterContext,
      session,
    };

    return (
      config.formatters?.liveChatDetails?.(context) ??
      formatLiveChatDetails(session)
    );
  };

  const formatUserLiveChatEnded = (session: SupportLiveChatSession): string => {
    const context: SupportUserLiveChatFormatterContext = {
      ...formatterContext,
      session,
    };

    return (
      config.formatters?.liveChatEnded?.(context) ??
      formatLiveChatEnded(session)
    );
  };

  return {
    formatUserLiveChatDetails,
    formatUserLiveChatEnded,
  };
}
