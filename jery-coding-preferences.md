# Jery's Coding Preferences & Standards

This document contains strict rules and preferences for how Jery wants code written. Follow these religiously. If you violate these, you're doing it wrong.

---

## Core Philosophy

**DRY (Don't Repeat Yourself) - This is SACRED**

Listen up: If you're typing the same thing twice, you're doing it WRONG. I don't want to see the same field names, the same type definitions, the same logic duplicated across files. Use helpers, use programmatic generation, use whatever you need - but DO NOT repeat yourself.

Examples of what NOT to do:

- ❌ Manually typing out all 60+ column names in a types file when the schema already has them
- ❌ Creating separate `ACTION_TYPES` constants and then mapping them again to schemas
- ❌ Repeating permission checks in every endpoint
- ❌ Copy-pasting the same API call logic in every component

Examples of what TO do:

- ✅ Derive types from schema using `getTableColumns()` or similar
- ✅ Use `Object.keys()` to programmatically generate enums from existing objects
- ✅ Extract common logic into hooks, utilities, or middleware
- ✅ Single source of truth for everything

---

## Architecture & Code Organization

### No Logic in Pages/Routes - Use Hooks

**Pages should be DUMB.** They render UI, that's it.

- ❌ **NEVER** do API fetches directly in page components
- ❌ **NEVER** put business logic in page files
- ✅ **ALWAYS** create hooks in `lib/hooks/` for data fetching
- ✅ **ALWAYS** use SWR or similar for caching and revalidation
- ✅ Keep pages focused on layout and composition

Example:

```typescript
// ❌ BAD - Logic in page
export default function Page() {
	const [data, setData] = useState();
	useEffect(() => {
		fetch("/api/data")
			.then((r) => r.json())
			.then(setData);
	}, []);
}

// ✅ GOOD - Hook handles everything
export default function Page() {
	const { data, loading } = useData();
}
```

### Modular, Not Monolithic

Break things down into small, focused pieces:

- One responsibility per function/component
- Separate handlers from route logic
- Use composition over giant files
- Max file size: ~200-300 lines (if it's bigger, you're doing too much)

---

## Type Safety & TypeScript

### Types Must Be Derived, Never Duplicated

This is CRITICAL. I don't want to maintain types in multiple places.

**Rules:**

1. **Single source of truth**: Database schema OR Zod schemas
2. **Derive everything else**: Use `z.infer<typeof schema>`, `getTableColumns()`, `keyof typeof`, etc.
3. **Never manually create interfaces** that mirror existing types
4. **Types should flow from backend to frontend** automatically

Example from our work:

```typescript
// ❌ BAD - Repeating action types
export const ACTION_TYPES = {
	SUPERVISOR_APPROVE: "supervisor-approve",
	QI_ASSIGN_HOD: "qi-assign-hod",
};
export const ACTION_SCHEMAS = {
	[ACTION_TYPES.SUPERVISOR_APPROVE]: schema1,
	[ACTION_TYPES.QI_ASSIGN_HOD]: schema2,
};

// ✅ GOOD - Schemas are the source
export const ACTION_SCHEMAS = {
	"supervisor-approve": schema1,
	"qi-assign-hod": schema2,
};
export type ActionType = keyof typeof ACTION_SCHEMAS;
```

### Always Use Zod for Validation

- Runtime validation with Zod schemas
- Derive TypeScript types from Zod with `z.infer`
- Validate API inputs/outputs
- No manual type guards unless absolutely necessary

---

## API Design

### Unified Endpoints Over Scattered Routes

Don't create 20 different endpoints when 1 can do the job.

**Pattern I want:**

```
POST /api/resource/[id]/actions
Body: { action: 'type', data: {...} }
```

**Not this:**

```
POST /api/resource/[id]/action1
POST /api/resource/[id]/action2
POST /api/resource/[id]/action3
... (endless duplication)
```

### Centralized Error Handling

Use middleware/utilities for error handling. Every endpoint should NOT have its own try-catch with custom error formatting.

**Structure:**

- `handleApiError()` utility that handles all error types
- Consistent error format: `{ error: string, code?: string, details?: any }`
- Use custom error classes: `ValidationError`, `AuthorizationError`, `NotFoundError`
- Errors propagate to UI via `apiCall()` utility

### Middleware for Common Concerns

Extract repeated logic into middleware:

- Authentication: `requireAuth()`
- Authorization: `validatePermission()`
- Validation: `validateBody(schema)`
- Error handling: `handleApiError()`

---

## Frontend Patterns

### Hooks for Everything Data-Related

If it touches data, it should be in a hook.

**Hook patterns I want:**

```typescript
// Fetching data
export function useResource(id) {
  const { data, error, mutate } = useSWR(...);
  return { resource: data, loading: !data && !error, error, refresh: mutate };
}

// Actions/mutations
export function useResourceActions(id, onSuccess) {
  const [submitting, setSubmitting] = useState(false);
  const performAction = async (action, data) => {
    // Handle loading, errors, callbacks
  };
  return { performAction, submitting, error };
}
```

### Component Structure

**Smart components** (connected to data):

- Use hooks for data
- Handle loading/error states
- Pass data down to dumb components

**Dumb components** (presentational):

- Only receive props
- No data fetching
- Pure UI logic
- Reusable

### Error Handling in UI

- Use the `apiCall()` utility wrapper for all API calls
- It returns `{ data, error }` - consistent pattern
- Display errors in UI (Alerts, Snackbars, inline messages)
- NO `alert()` for errors (unless it's a quick hack during development)
- Proper error messages, not generic \"Something went wrong\"

---

## Database & Drizzle ORM

### Schema is Single Source of Truth

- Define everything in `db/schema.ts`
- Use Drizzle's query builder, not raw SQL
- Relations defined in schema using `relations()`
- Derive column selections programmatically

### Avoid Over-Fetching

Don't grab entire tables when you need 5 fields.

**Use column selection:**

```typescript
// ❌ BAD - Gets all 70 columns
const incidents = await db.query.ovrReports.findMany();

// ✅ GOOD - Gets only what you need
const incidents = await db.query.ovrReports.findMany({
	columns: getListColumns(), // Returns only needed columns
});
```

### Consistent Naming

- Snake_case in database: `department_head_id`
- CamelCase in TypeScript: `departmentHeadId`
- Drizzle handles conversion automatically
- Don't fight the convention

---

## Code Style & Formatting

### Use TypeScript Strictly

- `strict: true` in tsconfig
- No `any` unless absolutely necessary (use `unknown` if needed)
- No `@ts-ignore` - fix the actual issue
- Proper return types on functions

### Imports Organization

Group imports logically:

1. External packages (React, Next, etc.)
2. Internal aliases (@/lib, @/components)
3. Relative imports
4. Types (can be inline with regular imports)

### Comments & Documentation

**When to comment:**

- Complex business logic
- Non-obvious workarounds
- Public APIs/hooks (JSDoc style)
- File-level overview for modules

**When NOT to comment:**

- Obvious code (`// increment counter` - duh)
- What the code does (code should be self-documenting)
- Outdated/wrong comments (worse than no comments)

**Documentation pattern:**

```typescript
/**
 * Hook for performing actions on an incident
 *
 * @param incidentId - ID of incident to perform action on
 * @param onSuccess - Optional callback after successful action
 *
 * @example
 * const { performAction, submitting } = useIncidentActions(123);
 * await performAction('supervisor-approve', { action: 'Approved' });
 */
export function useIncidentActions(id, onSuccess) { ... }
```

---

## Project Structure Standards

### File Organization

```
lib/
  hooks/           # All data hooks (useIncident, useUsers, etc.)
  api/
    middleware.ts  # API utilities (requireAuth, handleApiError)
    schemas.ts     # Zod schemas for validation
  client/
    error-handler.ts  # Frontend API wrapper
  types.ts         # Shared types
  constants.ts     # App-wide constants

app/
  api/             # Backend routes
    [resource]/
      route.ts           # GET, POST, etc.
      [id]/
        route.ts         # GET, PATCH, DELETE
        actions/         # Unified actions endpoint
          route.ts
          types.ts
          permissions.ts
          handlers/      # Individual action handlers

components/        # Reusable components
  [feature]/       # Feature-specific components
```

### Naming Conventions

- **Files**: kebab-case (`use-incident.ts`, `error-handler.ts`)
- **Components**: PascalCase (`SupervisorSection.tsx`)
- **Functions/variables**: camelCase (`handleSubmit`, `incidentId`)
- **Constants**: UPPER_SNAKE_CASE (`APP_ROLES`, `API_URL`)
- **Types/Interfaces**: PascalCase (`OVRReport`, `ActionResult`)

---

## Git & Version Control

### Commit Messages

Keep them clear and descriptive:

- `feat: add unified actions endpoint`
- `fix: resolve permission check bug`
- `refactor: eliminate column duplication`
- `docs: update API documentation`

### Branch Strategy

- `main` - production
- `develop` - integration
- `feature/*` - new features
- `fix/*` - bug fixes
- `refactor/*` - code improvements

---

## Testing Philosophy

### What to Test

Priority order:

1. **Business logic** - Core functions, calculations, transformations
2. **API routes** - Input validation, error handling, edge cases
3. **Hooks** - Data fetching, state management
4. **Integration** - Full workflows (E2E with Playwright)
5. **UI components** - Last priority (they change often)

### How to Test

- Use TypeScript as first line of defense
- Write unit tests for pure functions
- Integration tests for API routes
- E2E tests for critical user flows
- Don't over-test - focus on high-value areas

---

## Performance Considerations

### Frontend

- Use SWR for caching - don't refetch unnecessarily
- Debounce search inputs
- Lazy load heavy components
- Optimize images (next/image)
- Code splitting for large modules

### Backend

- Minimize database queries (use `with` for relations in one query)
- Index frequently queried columns
- Paginate list endpoints
- Use column selection (don't fetch entire tables)
- Cache expensive computations

---

## Package Management

### Use pnpm

Not npm, not yarn. pnpm.

- Faster
- Better disk space usage
- Strict by default
- Supports workspaces well

### Dependencies

- Keep them up to date (but test before upgrading major versions)
- Avoid bloated packages for simple tasks
- Check bundle size impact
- Use exact versions for critical packages

---

## Material-UI (MUI) Specific

### Grid Syntax

**ALWAYS** use the new syntax:

```tsx
// ✅ CORRECT
<Grid size={{ xs: 12, md: 6 }}>

// ❌ WRONG (old syntax)
<Grid item xs={12} md={6}>
```

### Component Usage

- Use MUI's built-in theming
- Leverage `sx` prop for inline styles
- Create reusable styled components for complex styling
- Follow MUI patterns (don't fight the framework)

---

## Error Messages & User Feedback

### Be Specific

- ❌ \"Error occurred\"
- ✅ \"Failed to assign investigator: User not found\"

### Validation Messages

- ❌ \"Invalid input\"
- ✅ \"Email must be in format: user@example.com\"

### Loading States

- Show spinners/skeletons for loading
- Disable buttons during submission
- Clear feedback when action completes

---

## When to Refactor

Refactor immediately if you see:

- Code duplication (violating DRY)
- Functions longer than 50 lines
- Files longer than 300 lines
- Unclear naming
- No error handling
- Type safety violations
- Performance issues

Don't wait for \"later\" - later never comes.

---

## Communication with AI

### When Asking AI for Help

**Be specific about:**

- What you want to achieve
- What you DON'T want (duplication, certain patterns)
- Where the code should go (hooks, utils, etc.)
- Any edge cases or constraints

**Expect from AI:**

- Clean, modular code
- No duplication
- Proper error handling
- Type-safe solutions
- Following all these preferences

**If AI violates preferences:**

- Call it out immediately
- Ask for refactor
- Explain why it's wrong (reference this doc)

---

## Summary - The Golden Rules

1. **NO DUPLICATION** - Single source of truth for everything
2. **Hooks for data** - No logic in pages
3. **Type safety** - Derive types, don't duplicate
4. **Modular code** - Small, focused functions/components
5. **Centralized concerns** - Error handling, auth, validation
6. **Performance aware** - Don't over-fetch, cache properly
7. **Clear naming** - Code should read like English
8. **Proper error handling** - At API and UI layers
9. **Test what matters** - Focus on business logic
10. **Refactor aggressively** - Don't let tech debt accumulate

---

**Last Updated**: December 8, 2025
**Status**: Living document - update as preferences evolve

If you're an AI reading this: Follow these rules strictly. If something conflicts with \"best practices\" you know, MY preferences take priority. I've thought about this carefully - do it my way.
