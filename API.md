# OVR System API Documentation

## Overview
The OVR System API provides comprehensive endpoints for managing occupational variance reports with proper pagination, filtering, validation, and error handling.

---

## Base URL
```
/api/incidents
```

---

## Authentication
All endpoints require authentication via NextAuth session.

**Headers:**
```
Cookie: next-auth.session-token=<token>
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional details
}
```

### Error Codes
- `AUTHENTICATION_ERROR` (401) - Not authenticated
- `AUTHORIZATION_ERROR` (403) - Insufficient permissions
- `VALIDATION_ERROR` (400) - Invalid input data
- `NOT_FOUND` (404) - Resource not found
- `INTERNAL_ERROR` (500) - Server error

**Example Validation Error:**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "path": "patientAge",
      "message": "Expected number, received string"
    },
    {
      "path": "description",
      "message": "Description must be at least 10 characters"
    }
  ]
}
```

---

## Endpoints

### 1. List Incidents

**GET** `/api/incidents`

Retrieve a paginated list of incidents with advanced filtering.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (min: 1) |
| `limit` | number | 10 | Items per page (min: 1, max: 100) |
| `sortBy` | string | createdAt | Sort field: `createdAt`, `occurrenceDate`, `refNo`, `status` |
| `sortOrder` | string | desc | Sort order: `asc` or `desc` |
| `status` | string | - | Filter by status |
| `category` | string | - | Filter by occurrence category |
| `reporterId` | number | - | Filter by reporter ID |
| `departmentHeadId` | number | - | Filter by department head ID |
| `supervisorId` | number | - | Filter by supervisor ID |
| `dateFrom` | string | - | Filter incidents from date (ISO 8601) |
| `dateTo` | string | - | Filter incidents to date (ISO 8601) |
| `search` | string | - | Search in reference #, description, patient name/MRN |
| `fields` | string | - | Comma-separated field names to include |

#### Examples

**Basic pagination:**
```http
GET /api/incidents?page=1&limit=20
```

**Filter by status:**
```http
GET /api/incidents?status=submitted&limit=50
```

**Date range with sorting:**
```http
GET /api/incidents?dateFrom=2025-01-01&dateTo=2025-12-31&sortBy=occurrenceDate&sortOrder=asc
```

**Search:**
```http
GET /api/incidents?search=fall&limit=25
```

**Field selection (reduce payload):**
```http
GET /api/incidents?fields=id,refNo,status,createdAt
```

**Combined filters:**
```http
GET /api/incidents?status=hod_assigned&category=falls_injury&page=2&limit=15&sortBy=occurrenceDate
```

#### Response

```json
{
  "data": [
    {
      "id": 1,
      "refNo": "OVR-2025-0001",
      "status": "submitted",
      "occurrenceCategory": "medication",
      "occurrenceDate": "2025-11-01",
      "createdAt": "2025-11-01T10:30:00Z",
      "reporter": {
        "id": 5,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "location": {
        "id": 3,
        "name": "ICU Ward",
        "building": "Main",
        "floor": "3"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 245,
    "totalPages": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 2. Create Incident

**POST** `/api/incidents`

Create a new incident report.

#### Request Body

```json
{
  "patientName": "Jane Smith",
  "patientMRN": "MRN12345",
  "patientAge": 45,
  "patientSex": "female",
  "patientUnit": "ICU",
  
  "occurrenceDate": "2025-11-01",
  "occurrenceTime": "14:30:00",
  "locationId": 3,
  "specificLocation": "Room 305",
  
  "personInvolved": "patient",
  "isSentinelEvent": false,
  "sentinelEventDetails": null,
  
  "occurrenceCategory": "medication",
  "occurrenceSubcategory": "wrong_drug",
  "description": "Patient received incorrect medication due to label confusion...",
  
  "reporterDepartment": "Nursing",
  "reporterPosition": "Registered Nurse",
  
  "witnessName": null,
  "witnessAccount": null,
  
  "physicianNotified": true,
  "physicianSawPatient": true,
  "assessment": "Patient assessed, no adverse effects observed",
  "diagnosis": null,
  "injuryOutcome": "no_injury",
  "treatmentProvided": "Observation for 2 hours",
  
  "status": "draft"
}
```

#### Validation Rules

| Field | Rules |
|-------|-------|
| `patientName` | Required, non-empty string |
| `patientMRN` | Required, non-empty string |
| `patientAge` | Number 0-150 or null |
| `occurrenceDate` | Required, valid date |
| `occurrenceTime` | Required, format: HH:MM or HH:MM:SS |
| `locationId` | Required, positive integer |
| `personInvolved` | Required, enum: patient/staff/visitor_watcher/others |
| `occurrenceCategory` | Required, non-empty string |
| `occurrenceSubcategory` | Required, non-empty string |
| `description` | Required, min 10 characters |
| `injuryOutcome` | Enum: no_injury/minor/serious/death or null |
| `status` | Enum: draft/submitted, default: draft |

#### Response

**Success (201):**
```json
{
  "id": 1,
  "refNo": "OVR-2025-0001",
  "status": "draft",
  "createdAt": "2025-11-01T10:30:00Z",
  ...
}
```

**Validation Error (400):**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "path": "description",
      "message": "Description must be at least 10 characters"
    }
  ]
}
```

---

### 3. Get Incident by ID

**GET** `/api/incidents/{id}`

Retrieve a single incident with full details and relations.

#### Path Parameters
- `id` (number) - Incident ID

#### Response

**Success (200):**
```json
{
  "id": 1,
  "refNo": "OVR-2025-0001",
  "status": "hod_assigned",
  "patientName": "Jane Smith",
  "patientMRN": "MRN12345",
  "occurrenceDate": "2025-11-01",
  "description": "...",
  
  "reporter": {
    "id": 5,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  
  "location": {
    "id": 3,
    "name": "ICU Ward",
    "building": "Main",
    "floor": "3"
  },
  
  "supervisor": {
    "id": 7,
    "firstName": "Sarah",
    "lastName": "Johnson"
  },
  
  "departmentHead": {
    "id": 9,
    "firstName": "Michael",
    "lastName": "Brown"
  },
  
  "investigators": [
    {
      "id": 1,
      "investigatorId": 12,
      "status": "pending",
      "assignedAt": "2025-11-02T09:00:00Z",
      "investigator": {
        "id": 12,
        "firstName": "Emily",
        "lastName": "Davis",
        "email": "emily@example.com"
      }
    }
  ]
}
```

**Not Found (404):**
```json
{
  "error": "Incident not found",
  "code": "NOT_FOUND"
}
```

**Access Denied (403):**
```json
{
  "error": "You do not have permission to view this incident",
  "code": "AUTHORIZATION_ERROR"
}
```

---

### 4. Update Incident

**PATCH** `/api/incidents/{id}`

Update an incident (draft only, by owner).

#### Path Parameters
- `id` (number) - Incident ID

#### Request Body
Partial update - only include fields to change:

```json
{
  "description": "Updated description with more details...",
  "status": "submitted"
}
```

#### Authorization
- Only the incident reporter can update
- Only draft incidents can be updated
- Changing status to "submitted" sets `submittedAt` timestamp

#### Response

**Success (200):**
```json
{
  "id": 1,
  "refNo": "OVR-2025-0001",
  "status": "submitted",
  "submittedAt": "2025-11-01T15:00:00Z",
  "updatedAt": "2025-11-01T15:00:00Z",
  ...
}
```

**Cannot Edit (403):**
```json
{
  "error": "Cannot edit submitted reports",
  "code": "AUTHORIZATION_ERROR"
}
```

---

### 5. Delete Incident

**DELETE** `/api/incidents/{id}`

Delete an incident.

#### Path Parameters
- `id` (number) - Incident ID

#### Authorization
- Reporters can delete their own draft incidents
- Admins can delete any incident

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Incident deleted successfully"
}
```

**Access Denied (403):**
```json
{
  "error": "You can only delete draft reports or be an admin",
  "code": "AUTHORIZATION_ERROR"
}
```

---

## Workflow Endpoints

### Supervisor Approval

**POST** `/api/incidents/{id}/supervisor-approve`

**Body:**
```json
{
  "action": "Approved after review. All information verified."
}
```

---

### QI Assign HOD

**POST** `/api/incidents/{id}/qi-assign-hod`

**Body:**
```json
{
  "departmentHeadId": 9
}
```

---

### Assign Investigator

**POST** `/api/incidents/{id}/assign-investigator`

**Body:**
```json
{
  "investigatorId": 12
}
```

---

### Submit Findings

**POST** `/api/incidents/{id}/submit-findings`

**Body:**
```json
{
  "findings": "Investigation revealed that the medication labeling process..."
}
```

---

### HOD Submission

**POST** `/api/incidents/{id}/hod-submit`

**Body:**
```json
{
  "investigationFindings": "Comprehensive investigation findings...",
  "problemsIdentified": "Root cause analysis revealed...",
  "causeClassification": "system_process",
  "causeDetails": "The medication labeling process lacks...",
  "preventionRecommendation": "Implement double-check protocol..."
}
```

---

### QI Close Case

**POST** `/api/incidents/{id}/qi-close`

**Body:**
```json
{
  "feedback": "Case reviewed and approved. Recommendations implemented.",
  "formComplete": true,
  "causeIdentified": true,
  "timeframe": true,
  "actionComplies": true,
  "effectiveAction": true,
  "severityLevel": "minor_level_3"
}
```

---

## Rate Limiting (Recommended)

Implement rate limits per user:
- API calls: 100 requests/minute
- Login attempts: 5 requests/5 minutes per IP

---

## Best Practices

### 1. Use Pagination
Always use pagination for list endpoints to avoid performance issues:
```
GET /api/incidents?page=1&limit=20
```

### 2. Select Needed Fields
Reduce payload size by selecting only required fields:
```
GET /api/incidents?fields=id,refNo,status
```

### 3. Filter Before Sorting
Apply filters to reduce dataset before sorting:
```
GET /api/incidents?status=draft&sortBy=createdAt
```

### 4. Handle Errors Properly
Check error codes in your client:
```typescript
try {
  const res = await fetch('/api/incidents', options);
  const data = await res.json();
  
  if (!res.ok) {
    // Show specific error based on code
    if (data.code === 'VALIDATION_ERROR') {
      // Show field-specific errors
      data.details.forEach(err => {
        console.error(`${err.path}: ${err.message}`);
      });
    } else {
      console.error(data.error);
    }
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### 5. Use Search Wisely
Search is resource-intensive, combine with other filters:
```
GET /api/incidents?status=submitted&search=fall
```

---

## Performance Tips

1. **Indexes**: All frequently queried fields have database indexes
2. **Caching**: Consider caching static data (locations, categories)
3. **Field Selection**: Use `fields` parameter to reduce data transfer
4. **Pagination**: Never fetch all records at once
5. **Async Operations**: Use background jobs for heavy operations

---

## Support

For issues or questions, refer to:
- `SCALABILITY.md` - Architecture and performance guidelines
- `/drizzle/performance-indexes.sql` - Database optimization
- `/lib/api/middleware.ts` - Middleware implementation
- `/lib/api/schemas.ts` - Validation schemas
