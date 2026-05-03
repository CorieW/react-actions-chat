---
"react-actions-chat-support": patch
---

- Remove built-in support flow limit and minimum validation defaults so callers only get configured behavior and validation.
- Treat omitted recent activity and transcript limits as unbounded in default support formatters.
