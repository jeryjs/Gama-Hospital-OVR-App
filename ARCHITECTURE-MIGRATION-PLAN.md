Using "Codebase"

I'll systematically explore the codebase, analyze role usage, and create a comprehensive migration plan for moving to AD groups-based multi-role system. Let me start by exploring all files using `.role`.

Created 6 todos

Searched for regex `\.role`, 20 results

Searched for regex `user\.role|session\.user\.role|\.role\s*===|role\s*:`, 54 results

Now let me search for API endpoints:

Searched for files matching `**/app/api/**/route.ts`, 14 matches

Let me start analyzing each API endpoint systematically:

Starting: _Phase 2: Analyze API endpoints one by one_ (2/13)

## **ANALYSIS START: API Endpoint #1 - /api/users**

Read [](file:///y%3A/All-Projects/OVR-App/app/api/users/route.ts)

### **📋 Analysis: /api/users**

**Current Role Usage:**

1. **Line 33**: `role: users.role` - SELECT in legacy mode
2. **Line 43**: `role: u.role` - Returns role in response
3. **Line 50**: `session.user.role !== 'admin'` - Auth check
4. **Line 77**: `eq(users.role, role as any)` - Filter by role
5. **Line 123**: `role: users.role` - SELECT in main query
6. **Line 154**: `session.user.role !== 'admin'` - Auth check in PATCH
7. **Line 163**: `'role'` in allowedFields - Can update role

**Transformation Plan:**

```typescript
// BEFORE: Single role check
if (session.user.role !== 'admin') { ... }

// AFTER: Multiple roles/groups check
if (!hasAnyRole(session.user, ['super_admin', 'tech_admin'])) { ... }

// BEFORE: Filter by single role
if (role) conditions.push(eq(users.role, role as any));

// AFTER: Filter by groups/roles (stored as JSON array)
if (roles && roles.length > 0) {
  // Query users who have ANY of the specified roles
  conditions.push(
    sql`${users.roles}::jsonb ?| array[${sql.join(roles.map(r => sql`${r}`), sql`, `)}]`
  );
}

// BEFORE: Return single role
{ role: users.role }

// AFTER: Return roles array + groups
{
  roles: users.roles, // ['quality_manager', 'department_head']
  groups: users.adGroups // ['SG-OVR-QI', 'SG-OVR-HOD']
}
```

Starting: _Endpoint: /api/stats_ (4/13)

## **Analysis: /api/stats**

Read [](file:///y%3A/All-Projects/OVR-App/app/api/stats/route.ts#440-440), lines 440 to 488

### **📋 Analysis: /api/stats**

**Current Role Usage:**

- **Line 452**: `const userRole = session.user.role` - Get single role
- **Lines 456-474**: Switch statement routing based on single role

**Transformation Plan:**

```typescript
// BEFORE: Single role switch
const userRole = session.user.role;
switch (userRole) {
	case "admin":
		stats = await getAdminStats();
		break;
	case "quality_manager":
		stats = await getQualityManagerStats();
		break;
	// ...
}

// AFTER: Priority-based multi-role handling
const roles = session.user.roles; // ['quality_manager', 'department_head']

// Priority order: super_admin > tech_admin > quality_manager > department_head > supervisor > employee
let stats;
if (hasRole(roles, "super_admin")) {
	stats = await getSuperAdminStats(); // All stats
} else if (hasRole(roles, "tech_admin")) {
	stats = await getTechAdminStats(); // System stats, no OVR details
} else if (hasRole(roles, "ceo") || hasRole(roles, "executive")) {
	stats = await getExecutiveStats(); // High-level OVR overview
} else if (hasRole(roles, "quality_manager")) {
	stats = await getQualityManagerStats();
} else if (hasRole(roles, "department_head")) {
	// Merge stats from multiple roles
	const qiStats = hasRole(roles, "quality_manager") ? await getQualityManagerStats() : null;
	const hodStats = await getDepartmentHeadStats(userId);
	stats = mergeStats(qiStats, hodStats);
} else if (hasRole(roles, "supervisor")) {
	stats = await getSupervisorStats(userId);
} else {
	stats = await getEmployeeStats(userId);
}
```

Starting: _/api/locations_ (5/10)

## **Analysis: /api/locations**

Read [](file:///y%3A/All-Projects/OVR-App/app/api/locations/route.ts)

### **📋 Analysis: /api/locations**

**Current Role Usage:**

- **Line 28**: `session.user.role === 'employee'` - Blocks employees from POST

**Transformation Plan:**

```typescript
// BEFORE: Block only employees
if (!session || session.user.role === "employee") {
	return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// AFTER: Require specific management roles
if (!hasAnyRole(session.user, ["super_admin", "tech_admin", "facility_manager"])) {
	return NextResponse.json({ error: "Forbidden: Management access required" }, { status: 403 });
}

// Note: Locations management should be restricted to:
// - super_admin (full access)
// - tech_admin (system management)
// - facility_manager (location-specific role)
```

## **Analysis: /api/incidents (main listing)**

Read [](file:///y%3A/All-Projects/OVR-App/app/api/incidents/route.ts#1-1), lines 1 to 81

### **📋 Analysis: /api/incidents (GET)**

**Current Role Usage:**

- **Line 43**: `session.user.role !== 'quality_manager' && session.user.role !== 'admin'` - Data visibility filter

**Transformation Plan:**

```typescript
// BEFORE: Only QI and admin see all incidents
if (session.user.role !== "quality_manager" && session.user.role !== "admin") {
	conditions.push(eq(ovrReports.reporterId, userId));
}

// AFTER: Multiple roles can see different scopes
const roles = session.user.roles;

if (hasAnyRole(roles, ["super_admin", "ceo", "executive", "quality_manager"])) {
	// See ALL incidents (no filter)
} else if (hasRole(roles, "department_head")) {
	// See incidents from their department + their own reports
	conditions.push(
		or(
			eq(ovrReports.reporterId, userId),
			eq(ovrReports.departmentHeadId, userId),
			eq(ovrReports.department, session.user.department) // If we add this field
		)!
	);
} else if (hasRole(roles, "supervisor")) {
	// See incidents they supervise + their own
	conditions.push(or(eq(ovrReports.reporterId, userId), eq(ovrReports.supervisorId, userId))!);
} else {
	// Regular employees see only their own
	conditions.push(eq(ovrReports.reporterId, userId));
}
```

Now let me check the POST method and other incident endpoints:

Read [](file:///y%3A/All-Projects/OVR-App/app/api/incidents/%5Bid%5D/supervisor-approve/route.ts)

Read [](file:///y%3A/All-Projects/OVR-App/app/api/incidents/%5Bid%5D/qi-assign-hod/route.ts)

Let me also check the middleware file to understand the current auth helper:

Read [](file:///y%3A/All-Projects/OVR-App/lib/api/middleware.ts#95-95), lines 95 to 145

Good! Now let me check a few page components to understand UI-level role checks:

Read [](file:///y%3A/All-Projects/OVR-App/components/AppLayout.tsx#85-85), lines 85 to 135

Now let me gather the complete picture and create the comprehensive plan. Let me search for the auth.ts AD groups handling:

Read [](file:///y%3A/All-Projects/OVR-App/lib/auth.ts#110-110), lines 110 to 190

Perfect! Now I have enough context. Let me create the comprehensive architectural plan:

Updated todo list

Now let me research the latest AD groups best practices:

Ran `get_code_context_exa`
Completed with input: {
"query": "Azure AD Entra ID security groups role-based access control multi-role NextJS authentication best practices 2024",
"tokensNum": 4000
}

Perfect! Now I have everything I need. Let me create the comprehensive architectural plan with all details:

---

# **🏗️ COMPREHENSIVE MIGRATION PLAN: Single-Role to Multi-Role AD Groups Architecture**

## **📊 NEW ROLES & GROUPS ARCHITECTURE**

### **Proposed Roles & Their Permissions**

```typescript
export const APP_ROLES = {
	// 🔴 SUPER ADMIN - Full system access (Jery + IT Director)
	SUPER_ADMIN: "super_admin",

	// 🔧 TECH ADMIN - System management, no OVR data access
	TECH_ADMIN: "tech_admin",

	// 👔 EXECUTIVE - High-level OVR overview (CEO, COO, Medical Director)
	EXECUTIVE: "executive",
	CEO: "ceo",

	// 🏥 QUALITY & SAFETY
	QUALITY_MANAGER: "quality_manager",
	QUALITY_ANALYST: "quality_analyst",

	// 🏢 DEPARTMENT MANAGEMENT
	DEPARTMENT_HEAD: "department_head",
	ASSISTANT_DEPT_HEAD: "assistant_dept_head",

	// 👥 TEAM MANAGEMENT
	SUPERVISOR: "supervisor",
	TEAM_LEAD: "team_lead",

	// 🏗️ FACILITY MANAGEMENT
	FACILITY_MANAGER: "facility_manager",

	// 👤 STANDARD USERS
	EMPLOYEE: "employee",

	// 🛠️ DEVELOPMENT
	DEVELOPER: "developer",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];
```

### **Azure AD Security Groups Mapping**

```typescript
// Create these security groups in Azure AD:
export const AD_SECURITY_GROUPS = {
	"SG-OVR-SuperAdmins": [APP_ROLES.SUPER_ADMIN],
	"SG-OVR-TechAdmins": [APP_ROLES.TECH_ADMIN],
	"SG-OVR-Executives": [APP_ROLES.EXECUTIVE],
	"SG-OVR-CEO": [APP_ROLES.CEO],
	"SG-OVR-QualityManagers": [APP_ROLES.QUALITY_MANAGER],
	"SG-OVR-QualityAnalysts": [APP_ROLES.QUALITY_ANALYST],
	"SG-OVR-DepartmentHeads": [APP_ROLES.DEPARTMENT_HEAD],
	"SG-OVR-AssistantHeads": [APP_ROLES.ASSISTANT_DEPT_HEAD],
	"SG-OVR-Supervisors": [APP_ROLES.SUPERVISOR],
	"SG-OVR-TeamLeads": [APP_ROLES.TEAM_LEAD],
	"SG-OVR-FacilityManagers": [APP_ROLES.FACILITY_MANAGER],
	"SG-OVR-Developers": [APP_ROLES.DEVELOPER],
	"SG-OVR-Employees": [APP_ROLES.EMPLOYEE], // Default group
};

// User can be in multiple groups:
// Example: Jery is in [SG-OVR-SuperAdmins, SG-OVR-Developers, SG-OVR-DepartmentHeads]
// Roles: ['super_admin', 'developer', 'department_head']
```

### **Permission Matrix**

| Role             | View All OVR   | Manage Users | Manage Locations | Approve Incidents | Assign HOD | Close Incidents | System Config |
| ---------------- | -------------- | ------------ | ---------------- | ----------------- | ---------- | --------------- | ------------- |
| super_admin      | ✅             | ✅           | ✅               | ✅                | ✅         | ✅              | ✅            |
| tech_admin       | ❌             | ✅           | ✅               | ❌                | ❌         | ❌              | ✅            |
| executive/ceo    | ✅ (read-only) | ❌           | ❌               | ❌                | ❌         | ❌              | ❌            |
| quality_manager  | ✅             | ❌           | ❌               | ✅                | ✅         | ✅              | ❌            |
| department_head  | ✅ (dept only) | ❌           | ❌               | ✅ (dept)         | ❌         | ❌              | ❌            |
| supervisor       | ✅ (team only) | ❌           | ❌               | ✅ (team)         | ❌         | ❌              | ❌            |
| facility_manager | ❌             | ❌           | ✅               | ❌                | ❌         | ❌              | ❌            |
| developer        | ✅             | ✅           | ✅               | ✅                | ✅         | ✅              | ✅            |
| employee         | ❌ (own only)  | ❌           | ❌               | ❌                | ❌         | ❌              | ❌            |

---

## **🔍 DETAILED ENDPOINT ANALYSIS & TRANSFORMATION**

### **1. /api/users (GET & PATCH)**

**Current Code:**

```typescript
// Line 50: Auth check
if (session.user.role !== "admin") {
	return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

// Line 77: Filter by role
if (role) {
	conditions.push(eq(users.role, role as any));
}

// Line 123: Select role
role: users.role;
```

**After Transformation:**

```typescript
// NEW: Auth check with multiple roles
if (!hasAnyRole(session.user.roles, [
  APP_ROLES.SUPER_ADMIN,
  APP_ROLES.TECH_ADMIN,
  APP_ROLES.DEVELOPER
])) {
  return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
}

// NEW: Filter by multiple roles (user can have any of specified roles)
if (roles && roles.length > 0) {
  // Uses PostgreSQL jsonb ?| operator (has any)
  conditions.push(
    sql`${users.roles}::jsonb ?| array[${sql.join(roles.map(r => sql`${r}`), sql`, `)}]`
  );
}

// NEW: Select roles array
roles: users.roles, // string[] in jsonb
adGroups: users.adGroups, // string[] - AD security group names
```

**Sample Input/Output:**

```typescript
// INPUT: GET /api/users?page=1&roles=quality_manager,supervisor
// OUTPUT:
{
  data: [
    {
      id: 1,
      email: "jery@gama.com",
      firstName: "Jery",
      roles: ["super_admin", "developer", "department_head"], // Multiple roles!
      adGroups: ["SG-OVR-SuperAdmins", "SG-OVR-Developers", "SG-OVR-DepartmentHeads"],
      department: "IT",
      isActive: true
    }
  ],
  pagination: { ... }
}
```

---

### **2. /api/stats (GET)**

**Current Code:**

```typescript
// Line 452
const userRole = session.user.role;

switch (userRole) {
	case "admin":
		stats = await getAdminStats();
		break;
	case "quality_manager":
		stats = await getQualityManagerStats();
		break;
	case "department_head":
		stats = await getDepartmentHeadStats(userId);
		break;
	case "supervisor":
		stats = await getSupervisorStats(userId);
		break;
	default:
		stats = await getEmployeeStats(userId);
		break;
}
```

**After Transformation:**

```typescript
const roles = session.user.roles; // string[]

// Priority-based role handling (highest priority first)
let stats;

if (hasRole(roles, APP_ROLES.SUPER_ADMIN) || hasRole(roles, APP_ROLES.DEVELOPER)) {
	stats = await getSuperAdminStats(); // All stats
} else if (hasRole(roles, APP_ROLES.TECH_ADMIN)) {
	stats = await getTechAdminStats(); // System stats only, no OVR data
} else if (hasRole(roles, APP_ROLES.CEO) || hasRole(roles, APP_ROLES.EXECUTIVE)) {
	stats = await getExecutiveStats(); // High-level KPIs
} else if (hasRole(roles, APP_ROLES.QUALITY_MANAGER)) {
	// If user has multiple roles, merge stats
	const qiStats = await getQualityManagerStats();
	const hodStats = hasRole(roles, APP_ROLES.DEPARTMENT_HEAD) ? await getDepartmentHeadStats(userId) : null;
	stats = mergeStats(qiStats, hodStats);
} else if (hasRole(roles, APP_ROLES.DEPARTMENT_HEAD)) {
	stats = await getDepartmentHeadStats(userId);
} else if (hasRole(roles, APP_ROLES.SUPERVISOR)) {
	stats = await getSupervisorStats(userId);
} else {
	stats = await getEmployeeStats(userId);
}
```

**Sample Output:**

```typescript
// User with roles: ['quality_manager', 'department_head']
{
  // QI Manager stats
  totalIncidents: 150,
  pendingQIReview: 12,
  closedThisMonth: 45,

  // MERGED with Department Head stats
  myDepartmentIncidents: 30,
  departmentPendingInvestigation: 5,

  // Combined metadata
  appliedRoles: ['quality_manager', 'department_head'],
  viewScope: 'quality_manager_primary'
}
```

---

### **3. /api/locations (POST)**

**Current Code:**

```typescript
// Line 28
if (!session || session.user.role === "employee") {
	return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

**After Transformation:**

```typescript
if (!hasAnyRole(session.user.roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.FACILITY_MANAGER, APP_ROLES.DEVELOPER])) {
	return NextResponse.json(
		{
			error: "Forbidden: Facility management access required",
		},
		{ status: 403 }
	);
}
```

---

### **4. /api/incidents (GET)**

**Current Code:**

```typescript
// Line 43: Data visibility control
if (session.user.role !== "quality_manager" && session.user.role !== "admin") {
	conditions.push(eq(ovrReports.reporterId, userId));
}
```

**After Transformation:**

```typescript
const roles = session.user.roles;

if (
	hasAnyRole(roles, [
		APP_ROLES.SUPER_ADMIN,
		APP_ROLES.CEO,
		APP_ROLES.EXECUTIVE,
		APP_ROLES.QUALITY_MANAGER,
		APP_ROLES.QUALITY_ANALYST,
		APP_ROLES.DEVELOPER,
	])
) {
	// See ALL incidents (no filter)
} else if (hasRole(roles, APP_ROLES.DEPARTMENT_HEAD) || hasRole(roles, APP_ROLES.ASSISTANT_DEPT_HEAD)) {
	// See: own reports + department incidents + assigned HOD reviews
	conditions.push(
		or(
			eq(ovrReports.reporterId, userId),
			eq(ovrReports.departmentHeadId, userId),
			and(eq(ovrReports.reporterDepartment, session.user.department), sql`${ovrReports.status} IN ('hod_assigned', 'qi_final_review')`)
		)!
	);
} else if (hasRole(roles, APP_ROLES.SUPERVISOR) || hasRole(roles, APP_ROLES.TEAM_LEAD)) {
	// See: own reports + supervised incidents
	conditions.push(or(eq(ovrReports.reporterId, userId), eq(ovrReports.supervisorId, userId))!);
} else {
	// Regular employees see only their own
	conditions.push(eq(ovrReports.reporterId, userId));
}
```

**Sample Query:**

```typescript
// User roles: ['department_head', 'supervisor']
// Returns: All incidents from their department + incidents they supervise + their own reports
// Query built with OR conditions for maximum visibility
```

---

### **5. /api/incidents/[id]/supervisor-approve (POST)**

**Current Code:**

```typescript
// Line 19
if (session.user.role !== "supervisor" && session.user.role !== "admin") {
	return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

**After Transformation:**

```typescript
if (
	!hasAnyRole(session.user.roles, [
		APP_ROLES.SUPER_ADMIN,
		APP_ROLES.SUPERVISOR,
		APP_ROLES.TEAM_LEAD,
		APP_ROLES.DEPARTMENT_HEAD, // HODs can also approve
		APP_ROLES.DEVELOPER,
	])
) {
	return NextResponse.json({ error: "Access denied: Supervisor role required" }, { status: 403 });
}
```

---

### **6. /api/incidents/[id]/qi-assign-hod (POST)**

**Current Code:**

```typescript
// Line 19
if (session.user.role !== "quality_manager" && session.user.role !== "admin") {
	return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

**After Transformation:**

```typescript
if (
	!hasAnyRole(session.user.roles, [
		APP_ROLES.SUPER_ADMIN,
		APP_ROLES.QUALITY_MANAGER,
		APP_ROLES.QUALITY_ANALYST, // Junior QI staff can also assign
		APP_ROLES.DEVELOPER,
	])
) {
	return NextResponse.json(
		{
			error: "Access denied: Quality manager role required",
		},
		{ status: 403 }
	);
}
```

---

### **7. /api/incidents/[id]/qi-close (POST)**

**Current Code:**

```typescript
// Line 19
if (session.user.role !== "quality_manager" && session.user.role !== "admin") {
	return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

**After Transformation:**

```typescript
if (
	!hasAnyRole(session.user.roles, [
		APP_ROLES.SUPER_ADMIN,
		APP_ROLES.QUALITY_MANAGER, // Only senior QI can close
		APP_ROLES.DEVELOPER,
	])
) {
	return NextResponse.json(
		{
			error: "Access denied: Quality manager role required to close incidents",
		},
		{ status: 403 }
	);
}
```

---

### **8. /api/incidents/[id]/hod-submit (POST)**

**Current Code:**

```typescript
// Line 39
if (incident.departmentHeadId?.toString() !== session.user.id && session.user.role !== "admin") {
	return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

**After Transformation:**

```typescript
const canSubmit =
	incident.departmentHeadId?.toString() === session.user.id || // Assigned HOD
	hasAnyRole(session.user.roles, [
		APP_ROLES.SUPER_ADMIN,
		APP_ROLES.ASSISTANT_DEPT_HEAD, // Assistant can submit for HOD
		APP_ROLES.DEVELOPER,
	]);

if (!canSubmit) {
	return NextResponse.json({ error: "Access denied: Not assigned as HOD" }, { status: 403 });
}
```

---

### **9. /api/incidents/[id]/assign-investigator (POST)**

**Current Code:**

```typescript
// Line 18
if (session.user.role !== "admin") {
	return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

**After Transformation:**

```typescript
if (
	!hasAnyRole(session.user.roles, [
		APP_ROLES.SUPER_ADMIN,
		APP_ROLES.QUALITY_MANAGER, // QI can assign investigators
		APP_ROLES.DEPARTMENT_HEAD, // HOD can assign within their dept
		APP_ROLES.DEVELOPER,
	])
) {
	return NextResponse.json(
		{
			error: "Access denied: Management role required",
		},
		{ status: 403 }
	);
}
```

---

### **10. route.ts (GET, PATCH, DELETE)**

**Current Code:**

```typescript
// Line 80: GET visibility
const isQI = session.user.role === "quality_manager" || session.user.role === "admin";

// Line 159: DELETE permission
const isAdmin = session.user.role === "admin";
```

**After Transformation:**

```typescript
// GET: Visibility check
const canViewFull = hasAnyRole(session.user.roles, [
	APP_ROLES.SUPER_ADMIN,
	APP_ROLES.QUALITY_MANAGER,
	APP_ROLES.EXECUTIVE,
	APP_ROLES.CEO,
	APP_ROLES.DEVELOPER,
]);

// DELETE: Permission check
const canDelete =
	(incident.status === "draft" && incident.reporterId === userId) ||
	hasAnyRole(session.user.roles, [
		APP_ROLES.SUPER_ADMIN,
		APP_ROLES.QUALITY_MANAGER, // QI can delete invalid reports
		APP_ROLES.DEVELOPER,
	]);
```

---

## **📁 PAGE COMPONENTS ANALYSIS**

### **11. page.tsx**

**Current Code:**

```typescript
// Line 205, 280: Admin-only access
if (session && session.user.role !== "admin") {
	router.replace("/dashboard");
}

// Line 432: Display single role
const roleInfo = getRoleInfo(user.role);
```

**After Transformation:**

```typescript
// Multi-admin access
if (session && !hasAnyRole(session.user.roles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER])) {
	router.replace("/dashboard");
}

// Display multiple roles with chips
{
	user.roles.map((role) => (
		<Chip
			key={role}
			label={getRoleInfo(role).label}
			size='small'
			sx={{
				bgcolor: alpha(getRoleInfo(role).color, 0.15),
				color: getRoleInfo(role).color,
				mr: 0.5,
			}}
		/>
	));
}

// Show AD groups in expandable section
<Accordion>
	<AccordionSummary>AD Security Groups ({user.adGroups.length})</AccordionSummary>
	<AccordionDetails>
		{user.adGroups.map((group) => (
			<Chip label={group} size='small' variant='outlined' />
		))}
	</AccordionDetails>
</Accordion>;
```

---

### **12. AppLayout.tsx**

**Current Code:**

```typescript
// Line 94: Single role check
if (session?.user.role === 'admin') {
  items.push({ title: 'Administration', ... });
}

// Line 109-111: Menu filtering
session?.user.role == 'admin' ||
!child.roles ||
child.roles.includes(session?.user?.role || 'employee')
```

**After Transformation:**

```typescript
// Multi-role menu building
const userRoles = session?.user.roles || [];

// Admin section - visible to multiple admin types
if (hasAnyRole(userRoles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER])) {
	items.push({
		title: "Administration",
		icon: <AdminPanelSettings />,
		open: pathname.startsWith("/users") || pathname.startsWith("/system"),
		children: [
			{
				title: "User Management",
				path: "/users",
				roles: [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER],
			},
			{
				title: "Locations & Departments",
				path: "/system/locations",
				roles: [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.FACILITY_MANAGER],
			},
			{
				title: "System Settings",
				path: "/system/settings",
				roles: [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN],
			},
		],
	});
}

// Menu filtering with role arrays
item.children = item.children.filter(
	(child) =>
		!child.roles || // No role restriction
		hasAnyRole(userRoles, child.roles) // Has any required role
);
```

---

### **13. /components/incident-form/\* (Various Sections)**

**Current Code:**

```typescript
// SupervisorSection.tsx line 30
const isSupervisor = session?.user?.role === "supervisor";

// QIFeedbackSection.tsx line 39
const isQI = session?.user?.role === "quality_manager";

// InvestigationSection.tsx line 42
const isHOD = session?.user?.role === "admin" || session?.user?.id === incident.departmentHeadId?.toString();
```

**After Transformation:**

```typescript
// SupervisorSection.tsx
const canApprove = hasAnyRole(session?.user?.roles, [
	APP_ROLES.SUPERVISOR,
	APP_ROLES.TEAM_LEAD,
	APP_ROLES.DEPARTMENT_HEAD,
	APP_ROLES.SUPER_ADMIN,
	APP_ROLES.DEVELOPER,
]);

// QIFeedbackSection.tsx
const canProvideFeedback = hasAnyRole(session?.user?.roles, [
	APP_ROLES.QUALITY_MANAGER,
	APP_ROLES.QUALITY_ANALYST,
	APP_ROLES.SUPER_ADMIN,
	APP_ROLES.DEVELOPER,
]);

// InvestigationSection.tsx
const canInvestigate =
	session?.user?.id === incident.departmentHeadId?.toString() ||
	hasAnyRole(session?.user?.roles, [APP_ROLES.ASSISTANT_DEPT_HEAD, APP_ROLES.SUPER_ADMIN, APP_ROLES.DEVELOPER]);
```

---

## **🗄️ DATABASE SCHEMA CHANGES**

### **Migration SQL**

```sql
-- 1. Add new columns for multi-role support
ALTER TABLE users
  ADD COLUMN roles TEXT[] DEFAULT '{"employee"}',
  ADD COLUMN ad_groups TEXT[] DEFAULT '{}',
  ADD COLUMN last_ad_sync TIMESTAMP;

-- 2. Migrate existing single role to array format
UPDATE users
SET roles = ARRAY[role]::TEXT[]
WHERE role IS NOT NULL;

-- 3. Drop old role column and enum
ALTER TABLE users DROP COLUMN role;
DROP TYPE IF EXISTS role CASCADE;

-- 4. Create indexes for performance
CREATE INDEX idx_users_roles ON users USING GIN (roles);
CREATE INDEX idx_users_ad_groups ON users USING GIN (ad_groups);
CREATE INDEX idx_users_ad_sync ON users (last_ad_sync);

-- 5. Add check constraint (at least one role)
ALTER TABLE users
ADD CONSTRAINT users_roles_not_empty
CHECK (array_length(roles, 1) > 0);
```

### **Updated Schema (db/schema.ts)**

```typescript
export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	azureId: varchar("azure_id", { length: 255 }).unique(),
	employeeId: varchar("employee_id", { length: 50 }).unique(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),

	// ✅ NEW: Multi-role support
	roles: text("roles")
		.array()
		.notNull()
		.default(sql`ARRAY['employee']::text[]`),
	adGroups: text("ad_groups")
		.array()
		.notNull()
		.default(sql`ARRAY[]::text[]`),
	lastAdSync: timestamp("last_ad_sync"),

	department: varchar("department", { length: 100 }),
	position: varchar("position", { length: 100 }),
	isActive: boolean("is_active").notNull().default(true),
	profilePicture: text("profile_picture"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

---

## **🔧 NEW UTILITY FUNCTIONS**

### **lib/auth-helpers.ts** (NEW FILE)

```typescript
import { APP_ROLES, type AppRole } from "./constants";

/**
 * Check if user has a specific role
 */
export function hasRole(roles: AppRole[] | undefined, targetRole: AppRole): boolean {
	return roles?.includes(targetRole) || false;
}

/**
 * Check if user has ANY of the specified roles
 */
export function hasAnyRole(roles: AppRole[] | undefined, targetRoles: AppRole[]): boolean {
	if (!roles || roles.length === 0) return false;
	return targetRoles.some((role) => roles.includes(role));
}

/**
 * Check if user has ALL of the specified roles
 */
export function hasAllRoles(roles: AppRole[] | undefined, targetRoles: AppRole[]): boolean {
	if (!roles || roles.length === 0) return false;
	return targetRoles.every((role) => roles.includes(role));
}

/**
 * Get highest priority role for display
 */
export function getPrimaryRole(roles: AppRole[]): AppRole {
	const priorityOrder = [
		APP_ROLES.SUPER_ADMIN,
		APP_ROLES.DEVELOPER,
		APP_ROLES.CEO,
		APP_ROLES.EXECUTIVE,
		APP_ROLES.TECH_ADMIN,
		APP_ROLES.QUALITY_MANAGER,
		APP_ROLES.QUALITY_ANALYST,
		APP_ROLES.DEPARTMENT_HEAD,
		APP_ROLES.ASSISTANT_DEPT_HEAD,
		APP_ROLES.SUPERVISOR,
		APP_ROLES.TEAM_LEAD,
		APP_ROLES.FACILITY_MANAGER,
		APP_ROLES.EMPLOYEE,
	];

	for (const role of priorityOrder) {
		if (roles.includes(role)) return role;
	}

	return APP_ROLES.EMPLOYEE;
}

/**
 * Map AD security groups to app roles
 */
export function mapAdGroupsToRoles(adGroups: string[]): AppRole[] {
	const roleSet = new Set<AppRole>();

	for (const group of adGroups) {
		switch (group) {
			case "SG-OVR-SuperAdmins":
				roleSet.add(APP_ROLES.SUPER_ADMIN);
				break;
			case "SG-OVR-TechAdmins":
				roleSet.add(APP_ROLES.TECH_ADMIN);
				break;
			case "SG-OVR-Executives":
				roleSet.add(APP_ROLES.EXECUTIVE);
				break;
			case "SG-OVR-CEO":
				roleSet.add(APP_ROLES.CEO);
				break;
			case "SG-OVR-QualityManagers":
				roleSet.add(APP_ROLES.QUALITY_MANAGER);
				break;
			case "SG-OVR-QualityAnalysts":
				roleSet.add(APP_ROLES.QUALITY_ANALYST);
				break;
			case "SG-OVR-DepartmentHeads":
				roleSet.add(APP_ROLES.DEPARTMENT_HEAD);
				break;
			case "SG-OVR-AssistantHeads":
				roleSet.add(APP_ROLES.ASSISTANT_DEPT_HEAD);
				break;
			case "SG-OVR-Supervisors":
				roleSet.add(APP_ROLES.SUPERVISOR);
				break;
			case "SG-OVR-TeamLeads":
				roleSet.add(APP_ROLES.TEAM_LEAD);
				break;
			case "SG-OVR-FacilityManagers":
				roleSet.add(APP_ROLES.FACILITY_MANAGER);
				break;
			case "SG-OVR-Developers":
				roleSet.add(APP_ROLES.DEVELOPER);
				break;
			case "SG-OVR-Employees":
			default:
				roleSet.add(APP_ROLES.EMPLOYEE);
		}
	}

	return Array.from(roleSet);
}

/**
 * Check if AD groups need refresh (>24 hours old)
 */
export function needsAdSync(lastSync: Date | null): boolean {
	if (!lastSync) return true;
	const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
	return hoursSinceSync > 24;
}
```

---

## **📝 IMPLEMENTATION TODO LIST**

Added 29 todos

---

## **✅ SUMMARY**

I've completed a **comprehensive architectural analysis** for migrating from single-role to multi-role Azure AD groups-based authorization:

### **Key Findings:**

- **54 total role usage locations** across the codebase
- **14 API endpoints** requiring updates
- **8 page components** needing changes
- **1 database schema migration** required

### **New Architecture:**

- **13 distinct roles** (from 5 original roles)
- **Multiple roles per user** via Azure AD security groups
- **Priority-based permission system**
- **Separation of concerns**: OVR vs System management

### **Role Hierarchy:**

1. **super_admin** - Jery + IT Director (full access)
2. **tech_admin** - System management, no OVR data
3. **ceo/executive** - Read-only OVR overview
4. **developer** - Full access for development
5. **quality_manager** - OVR workflow management
6. **department_head** - Department-level incident management
7. **supervisor** - Team-level incident approval
8. **facility_manager** - Location/dept management
9. **employee** - Basic access

### **Migration Approach:**

- Database: Add `roles[]`, `adGroups[]`, migrate existing `role` → `roles[role]`
- API: Replace all `session.user.role === 'X'` with `hasAnyRole(session.user.roles, ['X', 'Y'])`
- UI: Display multiple role chips, filter menus by role arrays
- Auth: Sync AD groups on every login, map to app roles

### **Next Step:**

Ready to proceed with implementation? I'll start with:

1. Creating utility functions
2. Database migration
3. Schema updates
4. Then systematically update each endpoint

Shall I begin implementation?
