---
'react-actions-chat': patch
---

- Disable transcript and persistent action buttons while shared chat loading is active, and briefly lock actions immediately after a click to prevent duplicate activations before loading appears.
- Keep async action callbacks from releasing newer action-button locks after a chat reset or remount.
- Keep label-only action buttons inert so buttons without click handlers do not briefly lock all actions.
