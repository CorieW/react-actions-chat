# React Actions Chat Support

Companion package for `react-actions-chat` that adds reusable support-desk flows for both customers and admins.

## Installation

```bash
npm install react-actions-chat react-actions-chat-support
```

## What It Includes

- `createSupportUserFlow`
- `createSupportAdminFlow`
- `createInMemorySupportFlowAdapter`

The package ships a shared adapter contract plus an in-memory implementation so
you can prototype ticketing, ticket queue review, live-chat queue review,
two-sided live-chat transcripts, assignment, and resolution flows without
wiring a backend first.

User flows show capability-driven entry actions: start a ticket, start a live
chat, and view existing tickets when tickets exist. Live-chat requests collect
an initial customer message, keep the customer input locked until an agent joins,
and expose persistent end-chat actions. Admin flows let agents join live chats,
reply through the shared input, and inject persistent live-chat actions. Ticket
review stays focused on ticket triage: assign to yourself or a named agent,
raise priority, reply, inspect activity, resolve, or return to admin options.

Both user and admin flows are designed to be extended instead of forked. Host
applications can pass:

- `callbacks` to override any adapter operation one method at a time
- `validation` to customize support input rules
- `labels` and `requestInputs` to change button copy, prompts, placeholders,
  validators, input modes, file-upload settings, abort labels,
  timeout/cooldown behavior, and request-button styling
- `formatters` to replace the markdown rendered for queues, tickets,
  transcripts, completion states, and opening messages
- `filterOptions` to add optional, configurable filter buttons for admin
  ticket queues, admin assigned work, admin live-chat queues, and customer
  ticket lists using backend filters, local predicates, or both
- `behavior` to adjust queue limits, recent-activity limits, live-chat
  send/open predicates, priority order, status transitions, queue button
  variants, assigned-work filters, and live-chat requeue math
- `customizeButtons` to replace, remove, or append buttons for each flow slot
- `liveChatPersistentButtons` or the `live-chat-persistent` button slot to
  extend or replace persistent live-chat actions

Admin ticket priority is set through the shared input dropdown.

The in-memory adapter is also configurable through factories for ticket
references, message IDs, live-chat IDs, timestamps, default statuses and
priorities, customer matching, queue status filters, queue positions, estimated
wait times, and sorting.
