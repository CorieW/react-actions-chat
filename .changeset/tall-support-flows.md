---
'react-actions-chat-support': major
---

Revise the support flow package around richer ticket and live-chat workflows. The in-memory support adapter now manages live-chat queues, sessions, transcripts, configurable IDs/defaults/sorting, and the user/admin flows expose callback-based configuration with customizable labels, formatters, validation, request inputs, confirmation buttons, persistent buttons, and button customization.

BREAKING: `SupportFlowAdapter` implementations must replace the removed knowledge-base search API with the new live-chat queue/session methods: `listLiveChatQueue`, `getLiveChatById`, `listCustomerLiveChats`, `updateLiveChat`, and `appendLiveChatMessage`. `SupportKnowledgeBaseArticle` and `DEFAULT_SUPPORT_KNOWLEDGE_BASE_ARTICLES` are no longer exported.
