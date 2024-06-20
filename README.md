# hoally

A webapp that allows members of home owner associations to discuss and vote on issues/proposals of their community.

Basic ideas:

- There is a number of HOA communities that can use the webapp independently from each other.
- It is possible to search for communities and use one of them as "current".
- Each HOA community has several members that correspond to houses of the association
  Each member has
  - An address
  - A name or nickname
  - A authentication method (i.e. token or password)
  Only members of an association can see information about that HOA community.
- Each HOA community can have a number of issues.
  An issue has
  - Status: open, moderated, archived.
  - An initiator which must be a member of the HOA.
  - One or more from a list of predefined tags.
  - At least 1 (or more) root subject/comment. 
  - Each comment can have subcomments that can have other HOA members as initiators
  - Each comment can have text but also several images or attachments.
  - Root subjects/comments have yes/no vote counts.
