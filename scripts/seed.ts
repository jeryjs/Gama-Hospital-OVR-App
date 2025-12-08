import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import { formatOVRId } from '../lib/generate-ovr-id'; // DRY: Use utility

dotenv.config({ path: ['.env.local', '.env'] });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create demo users
    const [admin, manager, employee] = await db
      .insert(schema.users)
      .values([
        {
          email: 'admin@gamahospital.com',
          azureId: 'demo-admin-id',
          firstName: 'Admin',
          lastName: 'User',
          roles: ['super_admin', 'developer'],
          department: 'Administration',
          employeeId: 'EMP001',
        },
        {
          email: 'manager@gamahospital.com',
          azureId: 'demo-manager-id',
          firstName: 'Quality',
          lastName: 'Manager',
          roles: ['quality_manager'],
          department: 'Quality Improvement',
          employeeId: 'EMP002',
        },
        {
          email: 'employee@gamahospital.com',
          azureId: 'demo-employee-id',
          firstName: 'John',
          lastName: 'Doe',
          roles: ['employee'],
          department: 'Nursing',
          employeeId: 'EMP003',
        },
      ])
      .returning();

    console.log('✅ Created demo users');

    // Create departments
    const [dept1, dept2] = await db
      .insert(schema.departments)
      .values([
        {
          name: 'Emergency Department',
          code: 'ED',
          headOfDepartment: admin.id,
        },
        {
          name: 'Nursing',
          code: 'NURS',
          headOfDepartment: manager.id,
        },
      ])
      .returning();

    console.log('✅ Created departments');

    // Create locations
    const [location1, location2] = await db
      .insert(schema.locations)
      .values([
        {
          name: 'Main Hospital Building',
          code: 'MHB',
          departmentId: dept1.id,
          building: 'Building A',
          floor: '3rd Floor',
        },
        {
          name: 'Emergency Department',
          code: 'ED',
          departmentId: dept1.id,
          building: 'Building A',
          floor: 'Ground Floor',
        },
      ])
      .returning();

    console.log('✅ Created locations');

    // Create sample OVR reports using ID format generator (DRY)
    await db.insert(schema.ovrReports).values([
      {
        id: formatOVRId(2025, 1, 1), // OVR-2025-01-001
        occurrenceDate: '2025-01-15',
        occurrenceTime: '14:30:00',
        locationId: location1.id,
        specificLocation: 'Room 305',
        personInvolved: 'staff',
        isSentinelEvent: false,
        occurrenceCategory: 'behavioral',
        occurrenceSubcategory: 'verbal_aggression',
        description: 'Patient family member became verbally aggressive towards nursing staff.',
        reporterId: employee.id,
        reporterDepartment: 'Nursing',
        reporterPosition: 'Registered Nurse',
        status: 'hod_assigned', // Updated to new flow
        submittedAt: new Date('2025-01-15T15:00:00'),
      },
      {
        id: formatOVRId(2025, 1, 2), // OVR-2025-01-002
        occurrenceDate: '2025-01-18',
        occurrenceTime: '22:15:00',
        locationId: location2.id,
        specificLocation: 'Waiting Room',
        personInvolved: 'patient',
        isSentinelEvent: true,
        sentinelEventDetails: 'Physical assault on healthcare worker',
        occurrenceCategory: 'behavioral',
        occurrenceSubcategory: 'assault',
        description: 'Intoxicated patient assaulted emergency physician.',
        reporterId: admin.id,
        reporterDepartment: 'Emergency',
        reporterPosition: 'Emergency Physician',
        injuryOutcome: 'minor',
        physicianNotified: true,
        physicianSawPatient: true,
        status: 'qi_final_review', // Updated to new flow
        submittedAt: new Date('2025-01-18T22:30:00'),
      },
    ]);

    console.log('✅ Created sample OVR reports');
    console.log('\\n🎉 Seeding completed successfully!');
    console.log('\\n📝 Test with these Azure accounts (must be @gamahospital.com):');
    console.log('- admin@gamahospital.com');
    console.log('- manager@gamahospital.com');
    console.log('- employee@gamahospital.com');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });