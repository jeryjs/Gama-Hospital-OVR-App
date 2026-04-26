I'd like u to work on this while keeping in mind the following prefernces—
- I prefer minimal code changes that touches the least number of files possible, but if you ever feel that a wider change would be more benificial in the long run, then I'd love to hear your plan.
- We already have plenty of util files in the codebase. So always check for existing util functions or any logic functions before you create one as its most likely already created. An example is how we have a very powerful Access_Control mapping in utils.
- Always prefer DRY principles, taking full advantage of our single-source-of-truth backed implementation.
- When writing logic prefer reusing existing variable, consts, functions or setStates instead of creating new one unless it justifies the need.
- When touching UI, look for reference implementations and then proceed to stay in line with rest of the implementation and maintain coding style.
- Maintain documentations cleanly and be careful not to remove/corrupt docs during edits.

Best practices for this repo:
- Prefer existing shared utilities and constants in `lib/` and `lib/utils/` rather than adding new helpers.
- Use the centralized `ACCESS_CONTROL` object for any permission or role-check logic; avoid duplicating access rules in API routes or components.
- Keep code path minimal: if a feature can be implemented by reusing components or utilities, do that before introducing new variants.
- Follow the current UI grid convention: use `<Grid size={{ xs: 12, md: 6 }}>` instead of legacy `<Grid item xs={12} md={6}>`.
- Keep Next.js app router conventions intact: only add `'use client'` when the component truly requires client-side behavior.
- Favor explicit type-safe imports from `@/lib/constants`, `@/lib/types`, `@/lib/utils`, and existing component props interfaces.
- When editing UI, mirror spacing, typography, and layout patterns already used in `app/` and `components/` rather than inventing new visual structure.
- Prefer `const` for stable values and avoid unnecessary state if the existing props or memoization solves it.
- Ensure API and UI both enforce access control: UI gating is helpful, but server-side API rules are required.
- Keep documentation brief and accurate: add or update comments only when they improve clarity and do not duplicate existing docs.
- If you spot a recurring pattern or duplicated logic, suggest a small refactor instead of patching around it.
- Use `pnpm` and repo scripts for local validation, e.g. `pnpm type-check`, before finalizing changes. (strictly avoid `pnpm lint` at the moment as its broken.)
