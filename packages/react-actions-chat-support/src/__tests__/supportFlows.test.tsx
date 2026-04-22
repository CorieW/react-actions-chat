import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Chat,
  useChatGlobalsStore,
  useChatStore,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'react-actions-chat';
import {
  createInMemorySupportFlowAdapter,
  createSupportAdminFlow,
  createSupportUserFlow,
} from 'react-actions-chat-support';

function resetChatStores(): void {
  useChatGlobalsStore.getState().resetChatGlobals();
  useChatStore.getState().clearMessages();
  usePersistentButtonStore.getState().clearButtons();
  useInputFieldStore.getState().setInputFieldValue('');
  useInputFieldStore.getState().resetInputFieldDescription();
  useInputFieldStore.getState().resetInputFieldPlaceholder();
  useInputFieldStore.getState().resetInputFieldDisabledPlaceholder();
  useInputFieldStore.getState().resetInputFieldType();
  useInputFieldStore.getState().resetInputFieldValidator();
  useInputFieldStore.getState().resetInputFieldSubmitGuard();
  useInputFieldStore.getState().resetInputFieldFiles();
  useInputFieldStore.getState().resetInputFieldFileUploadEnabled();
  useInputFieldStore.getState().resetInputFieldDisabledDefault();
  useInputFieldStore.getState().resetInputFieldDisabledPlaceholderDefault();
  useInputFieldStore.getState().resetInputFieldDisabled();
}

describe('support flows package', () => {
  beforeEach(() => {
    resetChatStores();
  });

  it('handles the customer support flow for tickets, knowledge-base search, and live chat', async () => {
    const user = userEvent.setup();
    const adapter = createInMemorySupportFlowAdapter();
    const flow = createSupportUserFlow({
      adapter,
      customer: {
        id: 'customer-1',
        name: 'Alex Morgan',
        email: 'alex@example.com',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(
      screen.getByRole('button', { name: 'Search help center' })
    );
    await user.type(
      screen.getByPlaceholderText('billing invoice renewal'),
      'refund'
    );
    await user.keyboard('{Enter}');
    expect(
      await screen.findByRole('button', {
        name: 'Refund and cancellation policy',
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open a ticket' }));
    await user.type(
      screen.getByPlaceholderText(
        'Our team cannot invite new users after enabling SSO.'
      ),
      'Our admins cannot invite new users after enabling SSO in production.'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is open for Alex Morgan/i,
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View my tickets' }));
    expect(
      await screen.findByRole('heading', {
        name: /Here are your latest tickets:/i,
      })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'SUP-1000' }));
    expect(
      await screen.findByRole('heading', { name: /Ticket SUP-1000/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Status:/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Our admins cannot invite new users after enabling SSO in production\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Add detail' }));
    await user.type(
      screen.getByPlaceholderText(
        'The error started after we rotated SSO certificates...'
      ),
      'The failures started right after the Okta certificate rotation at 9 AM UTC.'
    );
    await user.keyboard('{Enter}');
    expect(
      await screen.findByRole('heading', { name: /New detail/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /The failures started right after the Okta certificate rotation at 9 AM UTC\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Refresh status' }));
    expect(
      screen.getAllByText(
        /The failures started right after the Okta certificate rotation at 9 AM UTC\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', { name: 'View full activity' })
    );
    expect(
      await screen.findByRole('heading', {
        name: /Full activity for SUP-1000/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Our admins cannot invite new users after enabling SSO in production\./i
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        /The failures started right after the Okta certificate rotation at 9 AM UTC\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Start live chat' }));
    await user.type(
      screen.getByPlaceholderText(
        'We are blocked from deploying to production...'
      ),
      'Production admins are blocked and need an urgent handoff.'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', {
        name: /Live chat request chat-0001 is queued/i,
      })
    ).toBeInTheDocument();
  }, 15_000);

  it('restores customer guidance after an input flow is aborted', async () => {
    const user = userEvent.setup();
    const adapter = createInMemorySupportFlowAdapter();
    const flow = createSupportUserFlow({
      adapter,
      customer: {
        id: 'customer-3',
        name: 'Taylor Hart',
        email: 'taylor@example.com',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(
      screen.getByRole('button', { name: 'Search help center' })
    );
    await user.click(screen.getByRole('button', { name: 'Abort' }));

    expect(
      await screen.findByText(/Help-center search cancelled\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View my tickets' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Search help center' })
    ).toBeInTheDocument();
  });

  it('lets an admin triage and resolve tickets created through the shared adapter', async () => {
    const user = userEvent.setup();
    const adapter = createInMemorySupportFlowAdapter();
    const userFlow = createSupportUserFlow({
      adapter,
      customer: {
        id: 'customer-2',
        name: 'Jamie Rivera',
        email: 'jamie@example.com',
      },
    });
    const firstRender = render(
      <Chat initialMessages={userFlow.initialMessages} />
    );

    await user.click(screen.getByRole('button', { name: 'Open a ticket' }));
    await user.type(
      screen.getByPlaceholderText(
        'Our team cannot invite new users after enabling SSO.'
      ),
      'Billing renewal charged the wrong workspace and I need a refund review.'
    );
    await user.keyboard('{Enter}');
    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is open for Jamie Rivera/i,
      })
    ).toBeInTheDocument();

    firstRender.unmount();
    resetChatStores();

    const adminFlow = createSupportAdminFlow({
      adapter,
      agent: {
        id: 'agent-1',
        name: 'Morgan Admin',
        email: 'morgan@example.com',
      },
    });

    render(<Chat initialMessages={adminFlow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View queue' }));
    expect(
      await screen.findByRole('heading', { name: /Open queue/i })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'SUP-1000' }));

    expect(
      await screen.findByRole('heading', { name: /Ticket SUP-1000/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Customer:/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Billing renewal charged the wrong workspace and I need a refund review\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Assign to me' }));
    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is now assigned to Morgan Admin/i,
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Raise to high' }));
    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is now high priority/i,
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reply to customer' }));
    await user.type(
      screen.getByPlaceholderText(
        'We reproduced the issue and are working on a fix.'
      ),
      'We reviewed the billing event and are issuing the refund now.'
    );
    await user.keyboard('{Enter}');
    expect(
      await screen.findByRole('heading', {
        name: /Sent your reply on SUP-1000/i,
      })
    ).toBeInTheDocument();
    expect(await screen.findByText(/Reply sent/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /We reviewed the billing event and are issuing the refund now\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', { name: 'View full activity' })
    );
    expect(
      await screen.findByRole('heading', {
        name: /Full activity for SUP-1000/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Billing renewal charged the wrong workspace and I need a refund review\./i
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        /We reviewed the billing event and are issuing the refund now\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Offer live chat' }));
    expect(
      await screen.findByRole('heading', {
        name: /Queued chat-0001 for SUP-1000/i,
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resolve ticket' }));
    await user.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 has been resolved/i,
      })
    ).toBeInTheDocument();

    await waitFor(async () => {
      const ticket = await adapter.getTicketByReference('SUP-1000');
      expect(ticket?.status).toBe('resolved');
      expect(ticket?.assignedTo).toBe('Morgan Admin');
      expect(ticket?.liveChatOffered).toBe(true);
      expect(
        ticket?.messages.some(message => {
          return message.author === 'agent';
        })
      ).toBe(true);
    });
  }, 12_000);

  it('restores admin guidance after an input flow is aborted', async () => {
    const user = userEvent.setup();
    const adapter = createInMemorySupportFlowAdapter();
    const flow = createSupportAdminFlow({
      adapter,
      agent: {
        id: 'agent-2',
        name: 'Morgan Admin',
        email: 'morgan@example.com',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'Review a ticket' }));
    await user.click(screen.getByRole('button', { name: 'Abort' }));

    expect(
      await screen.findByText(/Ticket review cancelled\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View queue' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'My assigned work' })
    ).toBeInTheDocument();
  });
});
