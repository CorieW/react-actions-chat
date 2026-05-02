import { createButton, type MessageButton } from 'react-actions-chat';
import type { SupportAdminFlowLabels } from '../types';

interface CreateBackToAdminOptionsButtonOptions {
  readonly labels: SupportAdminFlowLabels;
  readonly showInitialOptions: () => void;
}

export function createBackToAdminOptionsButton({
  labels,
  showInitialOptions,
}: CreateBackToAdminOptionsButtonOptions): MessageButton {
  return createButton({
    label: labels.backToAdminOptions,
    onClick: showInitialOptions,
  });
}

interface CreateRefreshLiveChatButtonOptions {
  readonly labels: SupportAdminFlowLabels;
  readonly sessionId: string;
  readonly showLiveChat: (sessionId: string) => void;
}

export function createRefreshLiveChatButton({
  labels,
  sessionId,
  showLiveChat,
}: CreateRefreshLiveChatButtonOptions): MessageButton {
  return createButton({
    label: labels.refreshChat,
    onClick: () => {
      showLiveChat(sessionId);
    },
  });
}
