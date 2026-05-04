# react-actions-chat-support

## 2.1.0

### Minor Changes

- 1cbb427: - Track chat loading-state writes and chat lifecycle resets so delayed support loaders do not clear or reclaim newer loading owners.
  - Add paged ticket-list responses with request offsets so customer and admin flows can continue through backend-limited ticket result sets.
  - Show the chat loading indicator while support adapter and callback operations stay pending.

### Patch Changes

- 1c7d39e: - Remove built-in support flow limit and minimum validation defaults so callers only get configured behavior and validation.
  - Treat omitted recent activity and transcript limits as unbounded in default support formatters.

## 2.0.2

### Patch Changes

- e67015c: Stop applying default ticket and live-chat queue limits so support lists only paginate when a behavior limit is configured.

## 2.0.1

### Patch Changes

- ab8337e: - Keep the user-side `View tickets` action available in initial messages when ticket availability loads asynchronously.
  - Cover customer and admin ticket/live-chat workflows with async adapter methods.
  - Make admin opening guidance advertise only configured ticket and live-chat capabilities.
  - Pass resolved admin labels and capability flags to admin opening formatters.
  - Add configurable `filterOptions` for customer ticket lists and admin ticket, assigned-work, and live-chat queues using backend filters, local predicates, or both.
  - Restore the active list view when a user aborts filter selection instead of leaving the chat on the filter prompt.
  - Pass active filter and pagination metadata into ticket/live-chat list formatters and button customization contexts.
  - Publish the split support-flow implementation modules so package source imports resolve after the internal flow reorganization.
- ab8337e: - Sort admin ticket queues so unassigned tickets appear before assigned tickets while preserving each group's existing order.
  - Add previous/next pagination controls to customer ticket lists, admin ticket queues, assigned-work queues, and admin live-chat queues when there are more items than the configured limit.

## 2.0.0

### Major Changes

- 3858c8b: Revise the support flow package around richer ticket and live-chat workflows. The in-memory support adapter now manages live-chat queues, sessions, transcripts, configurable IDs/defaults/sorting, and the user/admin flows expose callback-based configuration with customizable labels, formatters, validation, request inputs, confirmation buttons, persistent buttons, and button customization.

  BREAKING: `SupportFlowAdapter` implementations must replace the removed knowledge-base search API with the new live-chat queue/session methods: `listLiveChatQueue`, `getLiveChatById`, `listCustomerLiveChats`, `updateLiveChat`, and `appendLiveChatMessage`. `SupportKnowledgeBaseArticle` and `DEFAULT_SUPPORT_KNOWLEDGE_BASE_ARTICLES` are no longer exported.

## 1.0.1

### Patch Changes

- b976874: Add npm package metadata including descriptions, keywords, author, repository links, and side-effect hints.
- Updated dependencies [b976874]
  - react-actions-chat@1.0.1
