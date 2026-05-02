import { createButton, type MessageButton } from 'react-actions-chat';
import type {
  SupportAdminFlowButtonContext,
  SupportAdminFlowLabels,
} from '../types';

type CustomizeAdminButtons = (
  context: Omit<SupportAdminFlowButtonContext, 'agent' | 'agentLabel'>
) => readonly MessageButton[];

interface CreateAdminPrimaryButtonsOptions {
  readonly labels: SupportAdminFlowLabels;
  readonly canListTicketQueue: boolean;
  readonly canOpenLiveChatQueue: boolean;
  readonly canGetTicket: boolean;
  readonly createReviewTicketButton: () => MessageButton;
  readonly showTicketQueue: () => void;
  readonly showLiveChatQueue: () => void;
  readonly showAssignedWork: () => void;
  readonly customizeButtons: CustomizeAdminButtons;
}

export function createAdminPrimaryButtons({
  labels,
  canListTicketQueue,
  canOpenLiveChatQueue,
  canGetTicket,
  createReviewTicketButton,
  showTicketQueue,
  showLiveChatQueue,
  showAssignedWork,
  customizeButtons,
}: CreateAdminPrimaryButtonsOptions): readonly MessageButton[] {
  const defaultButtons = [
    ...(canListTicketQueue
      ? [
          createButton({
            label: labels.viewTicketQueue,
            onClick: showTicketQueue,
          }),
        ]
      : []),
    ...(canOpenLiveChatQueue
      ? [
          createButton({
            label: labels.viewLiveChatQueue,
            onClick: showLiveChatQueue,
          }),
        ]
      : []),
    ...(canGetTicket ? [createReviewTicketButton()] : []),
    ...(canListTicketQueue
      ? [
          createButton({
            label: labels.myAssignedWork,
            onClick: showAssignedWork,
          }),
        ]
      : []),
  ];

  return customizeButtons({
    slot: 'primary',
    defaultButtons,
  });
}
