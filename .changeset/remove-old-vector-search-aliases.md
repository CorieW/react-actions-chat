---
'react-actions-chat-recommended-actions': minor
---

Remove the old vector-search config aliases `documents`, `getDocumentText`,
`getDocumentEmbedding`, and `toAction`. Configure vector search flows with
`buttons`, `getButtonText`, `getButtonEmbedding`, and `createAction`, and
return hosted search matches as `{ button, score }`.
