# OVR System Architecture

## 🎯 Single Source of Truth

### The Flow

```
1. Database Schema (/db/schema.ts)
   ↓ SINGLE SOURCE OF TRUTH
   ↓ Define tables with Drizzle ORM
   ↓
2. Zod Schemas (/lib/api/schemas.ts)
   ↓ Auto-generated using drizzle-zod
   ↓ createSelectSchema() / createInsertSchema()
   ↓ Add validation rules where needed
   ↓
3. TypeScript Types
   ↓ Inferred using z.infer<>
   ↓ Re-exported in /lib/types.ts
   ↓
4. Components & API Routes
   ↓ import types from /lib/types
   ↓ Always in sync with database!
```

---

## 📝 How to Make Changes

### **Scenario 1: Add a New Field**

**Step 1:** Update database schema

```typescript
// /db/schema.ts
export const ovrReports = pgTable("ovr_reports", {
	// ... existing fields
	newField: varchar("new_field", { length: 255 }), // ✅ Add here ONLY
});
```

**Step 2:** Generate migration

```bash
npm run db:generate
npm run db:push
```

**Step 3:** That's it! 🎉

- Zod schemas auto-update (via `createSelectSchema`)
- TypeScript types auto-update (via `z.infer<>`)
- All components get the new field automatically

**Optional:** Add validation rules

```typescript
// /lib/api/schemas.ts - only if you need custom validation
export const createIncidentSchema = ovrReportInsertSchema
  .omit({ ... })
  .refine((data) => data.newField && data.newField.length > 5, {
    message: 'New field must be at least 5 characters',
    path: ['newField'],
  });
```

---

### **Scenario 2: Change Field Type**

**Step 1:** Update database schema

```typescript
// /db/schema.ts
export const ovrReports = pgTable("ovr_reports", {
	patientAge: integer("patient_age"), // Changed from varchar to integer
});
```

**Step 2:** Generate and run migration

```bash
npm run db:generate
npm run db:push
```

**Step 3:** Done! ✅

- Types update everywhere automatically
- Compile errors if code needs fixing
- No manual type updates needed

---

### **Scenario 3: Add Custom Validation**

You only need to edit `/lib/api/schemas.ts`:

```typescript
// /lib/api/schemas.ts
export const createIncidentSchema = ovrReportInsertSchema
  .omit({ id: true, createdAt: true, ... })
  .refine((data) => {
    // Add custom validation logic
    if (data.isSentinelEvent && !data.sentinelEventDetails) {
      return false;
    }
    return true;
  }, {
    message: 'Sentinel event details required when sentinel event is true',
    path: ['sentinelEventDetails'],
  });
```

---

## 📁 File Structure

```
/db/schema.ts
  └─ Drizzle ORM table definitions
     └─ SINGLE SOURCE OF TRUTH for data structure

/lib/api/schemas.ts
  └─ Zod schemas (auto-generated from DB)
  └─ Validation rules (custom refinements)
  └─ Type inference (z.infer<>)

/lib/types.ts
  └─ Re-exports types from schemas
  └─ Central import point for types

/lib/api/middleware.ts
  └─ Error handling
  └─ Auth middleware
  └─ Validation helpers

/lib/client/error-handler.ts
  └─ Client-side error parsing
  └─ User-friendly error messages
```

---

## 🔄 Data Flow

### **API Request → Database**

```typescript
// 1. Client sends data
const response = await fetch("/api/incidents", {
	method: "POST",
	body: JSON.stringify(formData),
});

// 2. API validates using Zod schema
const body = await validateBody(request, createIncidentSchema);
// ✅ Validation errors returned with field details

// 3. Insert into database using Drizzle
const incident = await db.insert(ovrReports).values(body);
// ✅ Type-safe, no type casting needed
```

### **Database → Client**

```typescript
// 1. Query database
const incident = await db.query.ovrReports.findFirst({
	where: eq(ovrReports.id, id),
	with: { reporter: true, location: true },
});
// ✅ Drizzle infers return type

// 2. Return to client
return NextResponse.json(incident);
// ✅ Type matches OVRReportWithRelations

// 3. Client receives typed data
const { data } = await apiCall<OVRReportWithRelations>("/api/incidents/1");
// ✅ Full type safety end-to-end
```

---

## 🛠️ Key Libraries

| Library         | Purpose                        | Why                         |
| --------------- | ------------------------------ | --------------------------- |
| **Drizzle ORM** | Database schema & queries      | Type-safe SQL queries       |
| **drizzle-zod** | Auto-generate Zod from Drizzle | Single source of truth      |
| **Zod**         | Runtime validation             | Parse & validate API inputs |
| **TypeScript**  | Static typing                  | Compile-time safety         |

---

## ✅ Benefits

### **1. No Duplication**

- Database schema defined once
- Types auto-generated everywhere
- No manual syncing needed

### **2. Always in Sync**

- Change DB → types update automatically
- Impossible for types to drift
- Compiler catches breaking changes

### **3. End-to-End Type Safety**

```typescript
Database Schema (Drizzle)
  ↓ auto-generates
Zod Schemas
  ↓ infers
TypeScript Types
  ↓ used in
API Routes (type-safe queries)
  ↓ returns
Type-safe responses
  ↓ consumed by
Client (type-safe)
```

### **4. Validation = Types**

- Same schema for validation & types
- Runtime validation matches compile-time types
- Field errors automatically mapped

### **5. Better Developer Experience**

- Autocomplete everywhere
- Catch errors at compile time
- Clear error messages for users

---

## 🚫 What NOT to Do

### ❌ Don't manually define types

```typescript
// BAD - don't do this
export interface OVRReport {
	id: number;
	patientName: string;
	// ... 50 more fields
}
```

### ✅ Do this instead

```typescript
// GOOD - types auto-generated
export type OVRReport = z.infer<typeof ovrReportSelectSchema>;
```

---

### ❌ Don't duplicate schemas

```typescript
// BAD - don't manually create Zod schemas
export const ovrReportSchema = z.object({
	id: z.number(),
	patientName: z.string(),
	// ... 50 more fields
});
```

### ✅ Do this instead

```typescript
// GOOD - auto-generated from database
export const ovrReportSelectSchema = createSelectSchema(ovrReports);
```

---

### ❌ Don't use any or unknown

```typescript
// BAD
const incident: any = await fetch("/api/incidents/1").then((r) => r.json());
```

### ✅ Do this instead

```typescript
// GOOD - use typed helper
const { data, error } = await apiCall<OVRReport>("/api/incidents/1");
```

---

## 🎓 Examples

### **Example 1: Adding "priority" field**

```typescript
// 1. Update DB schema
export const ovrReports = pgTable("ovr_reports", {
	// ... existing fields
	priority: varchar("priority", { length: 20 }).default("normal"),
});

// 2. Run migration
// npm run db:generate && npm run db:push

// 3. Use it immediately!
// ✅ Types already updated everywhere
// ✅ Components can access incident.priority
// ✅ Forms can submit priority
// ✅ No manual updates needed
```

### **Example 2: Making field required with validation**

```typescript
// /lib/api/schemas.ts
export const createIncidentSchema = ovrReportInsertSchema
  .omit({ ... })
  .refine((data) => data.priority && data.priority.length > 0, {
    message: 'Priority is required',
    path: ['priority'],
  });

// ✅ Client gets field-specific error:
// "Priority: Priority is required"
```

---

## 📞 Quick Reference

**Need to:**

- **Add/change fields** → Edit `/db/schema.ts` → Run migrations → Done
- **Add validation** → Edit `/lib/api/schemas.ts` (refinements only)
- **Use types** → import from `/lib/types.ts`
- **Query database** → Use Drizzle ORM in API routes
- **Handle errors** → Use `apiCall()` helper in client

**Remember:** Database schema is the ONLY place you define structure!
