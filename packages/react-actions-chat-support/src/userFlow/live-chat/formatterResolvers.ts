import type { SupportLiveChatSession } from '../../supportFlowTypes';
import type {
  SupportUserFlowConfig,
  SupportUserFormatterContext,
  SupportUserLiveChatFormatterContext,
} from '../types';
import { formatLiveChatDetails, formatLiveChatEnded } from './formatters';

interface CreateUserLiveChatFormattersOptions {
  readonly config: SupportUserFlowConfig;
  readonly formatterContext: SupportUserFormatterContext;
}

interface UserLiveChatFormatters {
  readonly formatUserLiveChatDetails: (
    session: SupportLiveChatSession
  ) => string;
  readonly formatUserLiveChatEnded: (session: SupportLiveChatSession) => string;
}

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
