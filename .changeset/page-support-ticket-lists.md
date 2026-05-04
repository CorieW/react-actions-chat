---
'react-actions-chat': patch
'react-actions-chat-support': minor
---

- Track chat loading-state writes and chat lifecycle resets so delayed support loaders do not clear or reclaim newer loading owners.
- Add paged ticket-list responses with request offsets so customer and admin flows can continue through backend-limited ticket result sets.
- Show the chat loading indicator while support adapter and callback operations stay pending.
