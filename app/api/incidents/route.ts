import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import {
  createPaginatedResponse,
  handleApiError,
  parseFields,
  requireAuth,
  validateBody,
} from '@/lib/api/middleware';
import { createIncidentSchema, incidentListQuerySchema } from '@/lib/api/schemas';
import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';
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

    // Role-based access control
    if (session.user.role !== 'quality_manager' && session.user.role !== 'admin') {
      conditions.push(eq(ovrReports.reporterId, userId));
    }

    // Apply filters
    if (query.status) {
      conditions.push(sql`${ovrReports.status} = ${query.status}` as any);
    }

    if (query.category) {
      conditions.push(eq(ovrReports.occurrenceCategory, query.category));
    }

    if (query.reporterId) {
      conditions.push(eq(ovrReports.reporterId, query.reporterId));
    }

    if (query.departmentHeadId) {
      conditions.push(eq(ovrReports.departmentHeadId, query.departmentHeadId));
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
          like(ovrReports.refNo, `%${query.search}%`),
          like(ovrReports.description, `%${query.search}%`),
          like(ovrReports.patientName, `%${query.search}%`),
          like(ovrReports.patientMRN, `%${query.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column
    const sortColumn = {
      createdAt: ovrReports.createdAt,
      occurrenceDate: ovrReports.occurrenceDate,
      refNo: ovrReports.refNo,
      status: ovrReports.status,
    }[query.sortBy];

    const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ovrReports)
      .where(whereClause);

    const total = Number(countResult[0].count);

    // Parse field selection
    const fieldSelection = parseFields(query.fields);

    // Fetch paginated data with relations
    const incidents = await db.query.ovrReports.findMany({
      where: whereClause,
      limit: query.limit,
      offset,
      orderBy,
      columns: fieldSelection,
      with: {
        reporter: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        location: {
          columns: {
            id: true,
            name: true,
            building: true,
            floor: true,
          },
        },
        supervisor: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        departmentHead: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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

    // Generate reference number
    const year = new Date().getFullYear();
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ovrReports)
      .where(sql`EXTRACT(YEAR FROM ${ovrReports.createdAt}) = ${year}`);

    const count = Number(countResult[0].count) + 1;

    const newIncident = await db
      .insert(ovrReports)
      .values({
        refNo: `OVR-${year}-${String(count).padStart(4, '0')}`,
        reporterId: userId,

        // Patient Information
        patientName: body.patientName,
        patientMRN: body.patientMRN,
        patientAge: body.patientAge,
        patientSex: body.patientSex,
        patientUnit: body.patientUnit,

        // Occurrence Details
        occurrenceDate: body.occurrenceDate,
        occurrenceTime: body.occurrenceTime,
        locationId: body.locationId,
        specificLocation: body.specificLocation,

        // Person Involved
        personInvolved: body.personInvolved,
        isSentinelEvent: body.isSentinelEvent,
        sentinelEventDetails: body.sentinelEventDetails,

        // Staff Involved
        staffInvolvedId: body.staffInvolvedId,
        staffInvolvedName: body.staffInvolvedName,
        staffInvolvedPosition: body.staffInvolvedPosition,
        staffInvolvedEmployeeId: body.staffInvolvedEmployeeId,
        staffInvolvedDepartment: body.staffInvolvedDepartment,

        // Classification
        occurrenceCategory: body.occurrenceCategory,
        occurrenceSubcategory: body.occurrenceSubcategory,
        occurrenceDetail: body.occurrenceDetail,
        description: body.description,

        // Witness
        witnessName: body.witnessName,
        witnessAccount: body.witnessAccount,
        witnessDepartment: body.witnessDepartment,
        witnessPosition: body.witnessPosition,
        witnessEmployeeId: body.witnessEmployeeId,

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

        // Status
        status: body.status,
        submittedAt: body.status === 'submitted' ? new Date() : null,
      })
      .returning();

    return NextResponse.json(newIncident[0], { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
