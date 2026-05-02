---
'react-actions-chat-support': patch
---

- Keep the user-side `View tickets` action available in initial messages when ticket availability loads asynchronously.
- Cover customer and admin ticket/live-chat workflows with async adapter methods.
- Make admin opening guidance advertise only configured ticket and live-chat capabilities.
- Pass resolved admin labels and capability flags to admin opening formatters.
- Add configurable `filterOptions` for customer ticket lists and admin ticket, assigned-work, and live-chat queues using backend filters, local predicates, or both.
- Pass active filter and pagination metadata into ticket/live-chat list formatters and button customization contexts.
- Publish the split support-flow implementation modules so package source imports resolve after the internal flow reorganization.
