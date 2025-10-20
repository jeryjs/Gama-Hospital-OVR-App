import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { hash } from 'bcrypt';
import * as schema from '../db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create demo users
    const hashedPassword = await hash('admin123', 10);
    const employeePassword = await hash('employee123', 10);

    const [admin, manager, employee] = await db
      .insert(schema.users)
      .values([
        {
          email: 'admin@company.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          department: 'Administration',
        },
        {
          email: 'manager@company.com',
          password: hashedPassword,
          firstName: 'Manager',
          lastName: 'Smith',
          role: 'manager',
          department: 'Security',
        },
        {
          email: 'employee@company.com',
          password: employeePassword,
          firstName: 'John',
          lastName: 'Doe',
          role: 'employee',
          department: 'Nursing',
        },
      ])
      .returning();

    console.log('✅ Created demo users');

    // Create locations
    const [location1, location2, location3] = await db
      .insert(schema.locations)
      .values([
        {
          name: 'Main Hospital Building',
          address: '123 Medical Center Drive',
          city: 'Springfield',
          state: 'IL',
          postalCode: '62701',
          country: 'USA',
        },
        {
          name: 'Emergency Department',
          address: '123 Medical Center Drive',
          city: 'Springfield',
          state: 'IL',
          postalCode: '62701',
          country: 'USA',
        },
        {
          name: 'Outpatient Clinic',
          address: '456 Health Street',
          city: 'Springfield',
          state: 'IL',
          postalCode: '62702',
          country: 'USA',
        },
      ])
      .returning();

    console.log('✅ Created locations');

    // Create sample incidents
    await db.insert(schema.incidents).values([
      {
        reporterId: employee.id,
        incidentDate: new Date('2025-01-15'),
        incidentTime: '14:30',
        locationId: location1.id,
        specificLocation: 'Room 305, 3rd Floor',
        incidentType: 'verbal_abuse',
        severity: 'medium',
        status: 'submitted',
        victimName: 'Nurse Jane Smith',
        victimRole: 'Registered Nurse',
        perpetratorName: 'Patient Family Member',
        perpetratorType: 'visitor',
        perpetratorDescription: 'Male, approximately 40 years old, wearing blue jacket',
        description: 'Family member became agitated and verbally abusive towards nursing staff when informed about visiting hour restrictions.',
        immediateAction: 'Security was called and the visitor was escorted from the premises.',
        witnessesPresent: true,
        witnessDetails: 'Two other nurses and a security guard witnessed the incident.',
        policeNotified: false,
        injuriesOccurred: false,
        medicalAttentionRequired: false,
        submittedAt: new Date('2025-01-15T15:00:00'),
      },
      {
        reporterId: admin.id,
        incidentDate: new Date('2025-01-18'),
        incidentTime: '22:15',
        locationId: location2.id,
        specificLocation: 'Emergency Department Waiting Room',
        incidentType: 'physical_assault',
        severity: 'high',
        status: 'under_review',
        victimName: 'Dr. Michael Chen',
        victimRole: 'Emergency Physician',
        perpetratorName: 'Unknown patient',
        perpetratorType: 'patient',
        perpetratorDescription: 'Male, approximately 30 years old, intoxicated',
        description: 'Intoxicated patient became violent when being asked to wait. Pushed and struck the physician.',
        immediateAction: 'Security restrained the patient. Police were called immediately.',
        witnessesPresent: true,
        witnessDetails: 'Three nurses, two security guards, and multiple patients in waiting room.',
        policeNotified: true,
        policeReportNumber: 'SPD-2025-0118-456',
        injuriesOccurred: true,
        injuryDescription: 'Bruising to left arm and minor facial abrasion',
        medicalAttentionRequired: true,
        medicalAttentionDetails: 'First aid provided on-site, documented in medical records',
        assignedTo: manager.id,
        submittedAt: new Date('2025-01-18T22:30:00'),
      },
      {
        reporterId: employee.id,
        incidentDate: new Date('2025-01-20'),
        incidentTime: '09:45',
        locationId: location3.id,
        specificLocation: 'Reception Area',
        incidentType: 'threatening_behavior',
        severity: 'medium',
        status: 'resolved',
        victimName: 'Sarah Johnson',
        victimRole: 'Receptionist',
        perpetratorName: 'Disgruntled Patient',
        perpetratorType: 'patient',
        perpetratorDescription: 'Female, approximately 50 years old',
        description: 'Patient became threatening when informed of wait time for appointment.',
        immediateAction: 'Manager intervened and de-escalated the situation.',
        witnessesPresent: true,
        witnessDetails: 'Office manager and another receptionist',
        policeNotified: false,
        injuriesOccurred: false,
        medicalAttentionRequired: false,
        assignedTo: manager.id,
        reviewNotes: 'Patient was counseled about appropriate behavior. Security protocol reviewed with staff.',
        resolutionNotes: 'Incident resolved through communication. Staff trained on de-escalation techniques.',
        resolutionDate: new Date('2025-01-22'),
        submittedAt: new Date('2025-01-20T10:00:00'),
      },
    ]);

    console.log('✅ Created sample incidents');
    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Demo credentials:');
    console.log('Admin: admin@company.com / admin123');
    console.log('Manager: manager@company.com / admin123');
    console.log('Employee: employee@company.com / employee123');
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
