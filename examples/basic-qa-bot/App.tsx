import { useMemo } from 'react';
import type { ChatFlow } from 'actionable-support-chat';
import { Chat, useChatStore } from 'actionable-support-chat';

/**
 * Basic Question and Answer Bot Example
 *
 * This example demonstrates both simple and open-ended flows:
 * - Quick one-step flows (help overview, time check)
 * - A conversational Q&A flow driven by user messages
 */
export function App(): React.JSX.Element {
  const { addMessage } = useChatStore();

  // Simple Q&A responses - in a real app, this would connect to an API
  const handleQuestion = (question: string): void => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi')) {
      addMessage({
        type: 'other',
        content: 'Hello! How can I help you today?',
      });
    } else if (lowerQuestion.includes('help')) {
      addMessage({
        type: 'other',
        content:
          'I can help answer questions, provide information, or assist with various topics. What would you like to know?',
      });
    } else if (lowerQuestion.includes('weather')) {
      addMessage({
        type: 'other',
        content:
          "I don't have access to real-time weather data, but I'd be happy to help you find a weather service or answer other questions!",
      });
    } else if (lowerQuestion.includes('time')) {
      const currentTime = new Date().toLocaleTimeString();
      addMessage({
        type: 'other',
        content: `The current time is ${currentTime}.`,
      });
    } else if (
      lowerQuestion.includes('bye') ||
      lowerQuestion.includes('goodbye')
    ) {
      addMessage({
        type: 'other',
        content: 'Goodbye! Have a great day!',
      });
    } else {
      addMessage({
        type: 'other',
        content:
          "That's an interesting question! I'm a basic Q&A bot, so I might not have all the answers, but I'll do my best to help. Could you rephrase your question?",
      });
    }
  };

  const QA_FLOWS: readonly ChatFlow[] = useMemo(
    () => [
      {
        id: 'help-overview',
        buttons: [
          {
            label: 'What can you do?',
            onClick: () => {
              addMessage({
                type: 'other',
                content:
                  'I can help answer questions, provide information, or assist with various topics. What would you like to know?',
              });
            },
          },
        ],
      },
      {
        id: 'quick-time-check',
        buttons: [
          {
            label: 'What time is it?',
            onClick: () => {
              const currentTime = new Date().toLocaleTimeString();
              addMessage({
                type: 'other',
                content: `The current time is ${currentTime}.`,
              });
            },
          },
        ],
      },
    ],
    [addMessage]
  );

  const CHAT_INITIAL_FLOW: ChatFlow = useMemo(
    () => ({
      id: 'qa-home',
      initialMessage: {
        type: 'other',
        content:
          "Hello! Choose a quick flow below or ask me anything and I'll do my best to help.",
        buttons: QA_FLOWS.flatMap(flow => flow.buttons ?? []),
        userResponseCallback: () => {
          const messages = useChatStore.getState().getMessages();
          const lastSelfMessage = [...messages]
            .reverse()
            .find(msg => msg.type === 'self');
          if (lastSelfMessage) {
            handleQuestion(lastSelfMessage.content);
          }
        },
      },
    }),
    [QA_FLOWS]
  );

  return <Chat initialFlow={CHAT_INITIAL_FLOW} theme='dark' />;
}
