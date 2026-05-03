---
'react-actions-chat': patch
'react-actions-chat-support': patch
---

- Track chat loading-state writes so delayed support loaders do not clear newer loading owners.
- Add paged ticket-list responses with request offsets so customer and admin flows can continue through backend-limited ticket result sets.
- Show the chat loading indicator while support adapter and callback operations stay pending.
