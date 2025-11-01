import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');

    // Fetch incidents based on role and status filter
    let incidents;

    if (session.user.role === 'quality_manager' || session.user.role === 'admin') {
      // QI and admin see all incidents
      incidents = await db
        .select({
          id: ovrReports.id,
          referenceNumber: ovrReports.referenceNumber,
          occurrenceDate: ovrReports.occurrenceDate,
          occurrenceCategory: ovrReports.occurrenceCategory,
          occurrenceSubcategory: ovrReports.occurrenceSubcategory,
          status: ovrReports.status,
          createdAt: ovrReports.createdAt,
        })
        .from(ovrReports);

      // Filter by status if provided
      if (statusFilter) {
        incidents = incidents.filter(i => i.status === statusFilter);
      }

      // Fetch reporter info for each incident
      const incidentsWithReporter = await Promise.all(
        incidents.map(async (incident) => {
          const fullIncident = await db.query.ovrReports.findFirst({
            where: eq(ovrReports.id, incident.id),
            with: {
              reporter: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });
          return {
            ...incident,
            reporter: fullIncident?.reporter,
          };
        })
      );

      return NextResponse.json(incidentsWithReporter);
    } else {
      // Regular employees see only their own incidents
      incidents = await db
        .select({
          id: ovrReports.id,
          referenceNumber: ovrReports.referenceNumber,
          occurrenceDate: ovrReports.occurrenceDate,
          occurrenceCategory: ovrReports.occurrenceCategory,
          occurrenceSubcategory: ovrReports.occurrenceSubcategory,
          status: ovrReports.status,
          createdAt: ovrReports.createdAt,
        })
        .from(ovrReports)
        .where(eq(ovrReports.reporterId, userId));

      if (statusFilter) {
        incidents = incidents.filter(i => i.status === statusFilter);
      }

      return NextResponse.json(incidents);
    }
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userId = parseInt(session.user.id);

    // Generate reference number
    const year = new Date().getFullYear();
    const count = await db
      .select()
      .from(ovrReports)
      .then((rows) => rows.length + 1);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const referenceNumber = `OVR-${year}${month}-${String(count).padStart(3, '0')}`;

    const newIncident = await db
      .insert(ovrReports)
      .values({
        referenceNumber,
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
        staffInvolvedName: body.staffInvolvedName,
        staffPosition: body.staffPosition,
        staffEmployeeId: body.staffEmployeeId,
        staffDepartment: body.staffDepartment,
        
        // Classification
        occurrenceCategory: body.occurrenceCategory,
        occurrenceSubcategory: body.occurrenceSubcategory,
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
        
        // Supervisor
        supervisorAction: body.supervisorAction,
        
        // Reporter Info
        reporterDepartment: session.user.department,
        reporterPosition: session.user.position,
        
        // Status
        status: body.status || 'draft',
        submittedAt: body.status === 'submitted' ? new Date() : null,
      })
      .returning();

    return NextResponse.json(newIncident[0], { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
