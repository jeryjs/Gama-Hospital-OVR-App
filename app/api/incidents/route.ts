import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import {
  createPaginatedResponse,
  handleApiError,
  parseFields,
  requireAuth,
  validateBody,
} from '@/lib/api/middleware';
import {
  createIncidentSchema,
  incidentListQuerySchema,
  getListColumns,
  incidentRelations,
} from '@/lib/api/schemas';
import { buildIncidentVisibilityFilter } from '@/lib/utils';
import { generateOVRId } from '@/lib/generate-ovr-id';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { and, asc, desc, eq, like, or, sql, ne } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const query = incidentListQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      status: searchParams.get('status'),
      category: searchParams.get('category'),
      reporterId: searchParams.get('reporterId'),
      departmentHeadId: searchParams.get('departmentHeadId'),
      supervisorId: searchParams.get('supervisorId'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      search: searchParams.get('search'),
      fields: searchParams.get('fields'),
    });

    const userId = parseInt(session.user.id);
    const offset = (query.page - 1) * query.limit;

    // Build where conditions
    const conditions = [];

    // Determine if this is a "my reports" request (reporterId matches current user)
    const isMyReportsRequest = query.reporterId === userId;

    // Role-based access control using security utility
    // Drafts are now in localStorage only - never show drafts from DB
    const visibilityFilter = buildIncidentVisibilityFilter(
      {
        userId,
        roles: session.user.roles,
        email: session.user.email,
      },
      {
        includeDrafts: false, // Drafts are localStorage only now
        myReportsOnly: isMyReportsRequest,
      }
    );

    if (visibilityFilter) {
      conditions.push(visibilityFilter);
    }

    // Always exclude drafts from API results (legacy data protection)
    conditions.push(ne(ovrReports.status, 'draft'));

    // Apply filters
    if (query.status) {
      // Skip draft status filter - drafts are localStorage only
      if (query.status !== 'draft') {
        conditions.push(sql`${ovrReports.status} = ${query.status}` as any);
      }
    }

    if (query.category) {
      conditions.push(eq(ovrReports.occurrenceCategory, query.category));
    }

    if (query.reporterId) {
      conditions.push(eq(ovrReports.reporterId, query.reporterId));
    }

    if (query.supervisorId) {
      conditions.push(eq(ovrReports.supervisorId, query.supervisorId));
    }

    if (query.dateFrom) {
      conditions.push(sql`${ovrReports.occurrenceDate} >= ${query.dateFrom}`);
    }

    if (query.dateTo) {
      conditions.push(sql`${ovrReports.occurrenceDate} <= ${query.dateTo}`);
    }

    if (query.search) {
      conditions.push(
        or(
          like(ovrReports.id, `%${query.search}%`), // Search by OVR ID
          like(ovrReports.description, `%${query.search}%`),
          like(ovrReports.involvedPersonName, `%${query.search}%`),
          like(ovrReports.involvedPersonMRN, `%${query.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column
    const sortColumn = {
      createdAt: ovrReports.createdAt,
      occurrenceDate: ovrReports.occurrenceDate,
      id: ovrReports.id,
      status: ovrReports.status,
    }[query.sortBy];

    const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ovrReports)
      .where(whereClause);

    const total = Number(countResult[0].count);

    const columns = parseFields(query.fields) || getListColumns();

    // Fetch paginated data with relations
    const incidents = await db.query.ovrReports.findMany({
      where: whereClause,
      limit: query.limit,
      offset,
      orderBy,
      columns,
      with: {
        reporter: incidentRelations.reporter,
      },
    });

    return NextResponse.json(
      createPaginatedResponse(incidents, total, {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    // Validate request body
    const body = await validateBody(request, createIncidentSchema);
    const userId = parseInt(session.user.id);

    // Generate OVR ID using utility (DRY principle)
    // All incidents from API are submitted (drafts are localStorage only)
    const ovrId = await generateOVRId();

    const newIncident = await db
      .insert(ovrReports)
      .values({
        id: ovrId,
        reporterId: userId,

        // Occurrence Details
        occurrenceDate: body.occurrenceDate,
        occurrenceTime: body.occurrenceTime,
        locationId: body.locationId,
        specificLocation: body.specificLocation,

        // Person Involved (unified)
        personInvolved: body.personInvolved,
        involvedPersonName: body.involvedPersonName,
        involvedPersonAge: body.involvedPersonAge,
        involvedPersonSex: body.involvedPersonSex,
        involvedPersonUnit: body.involvedPersonUnit,
        involvedPersonMRN: body.involvedPersonMRN,
        involvedStaffId: body.involvedStaffId,
        involvedPersonEmployeeId: body.involvedPersonEmployeeId,
        involvedPersonPosition: body.involvedPersonPosition,
        involvedPersonRelation: body.involvedPersonRelation,
        involvedPersonContact: body.involvedPersonContact,
        isSentinelEvent: body.isSentinelEvent,
        sentinelEventDetails: body.sentinelEventDetails,

        // Classification
        occurrenceCategory: body.occurrenceCategory,
        occurrenceSubcategory: body.occurrenceSubcategory,
        occurrenceDetail: body.occurrenceDetail,
        description: body.description,
        levelOfHarm: body.levelOfHarm,

        // Medical
        physicianNotified: body.physicianNotified,
        physicianSawPatient: body.physicianSawPatient,
        assessment: body.assessment,
        diagnosis: body.diagnosis,
        injuryOutcome: body.injuryOutcome,
        treatmentProvided: body.treatmentProvided,
        physicianName: body.physicianName,
        physicianId: body.physicianId,

        // Reporter Info
        reporterDepartment: body.reporterDepartment || session.user.department,
        reporterPosition: body.reporterPosition || session.user.position,

        // Status - Always submitted (drafts are localStorage only)
        status: 'submitted',
        submittedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newIncident[0], { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
