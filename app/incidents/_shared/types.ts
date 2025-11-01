// Type definitions for OVR incident data

export interface OVRReport {
  id: number;
  referenceNumber: string;
  status: string;
  
  // Patient Information
  patientName: string;
  patientMRN: string;
  patientAge: string | null;
  patientSex: string | null;
  patientUnit: string | null;
  
  // Occurrence Details
  occurrenceDate: string;
  occurrenceTime: string;
  locationId: number;
  location?: {
    id: number;
    name: string;
    building?: string;
    floor?: string;
  };
  specificLocation: string | null;
  
  // Person Involved
  personInvolved: string;
  isSentinelEvent: boolean;
  sentinelEventDetails: string | null;
  
  // Staff Involved
  staffInvolvedName: string | null;
  staffInvolvedPosition: string | null;
  staffInvolvedEmployeeId: string | null;
  staffInvolvedDepartment: string | null;
  
  // Classification
  occurrenceCategory: string;
  occurrenceSubcategory: string;
  description: string;
  
  // Witness
  witnessName: string | null;
  witnessAccount: string | null;
  witnessDepartment: string | null;
  witnessPosition: string | null;
  witnessEmployeeId: string | null;
  
  // Medical Assessment
  physicianNotified: boolean;
  physicianSawPatient: boolean;
  assessment: string | null;
  diagnosis: string | null;
  injuryOutcome: string | null;
  treatmentProvided: string | null;
  physicianName: string | null;
  physicianId: string | null;
  
  // Reporter
  reporterId: number;
  reporterDepartment: string | null;
  reporterPosition: string | null;
  reporterEmployeeId: string | null;
  reporter?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  // Supervisor
  supervisorId: number | null;
  supervisorAction: string | null;
  supervisorActionDate: string | null;
  supervisorApprovedAt: string | null;
  supervisor?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  
  // QI Department
  qiReceivedBy: number | null;
  qiReceivedDate: string | null;
  qiAssignedBy: number | null;
  qiAssignedDate: string | null;
  qiFeedback: string | null;
  qiFormComplete: boolean | null;
  qiCauseIdentified: boolean | null;
  qiTimeframe: boolean | null;
  qiActionComplies: boolean | null;
  qiEffectiveAction: boolean | null;
  severityLevel: string | null;
  
  // Department Head
  departmentHeadId: number | null;
  hodAssignedAt: string | null;
  investigationFindings: string | null;
  problemsIdentified: string | null;
  causeClassification: string | null;
  causeDetails: string | null;
  preventionRecommendation: string | null;
  hodActionDate: string | null;
  hodSubmittedAt: string | null;
  departmentHead?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  closedAt: string | null;
  
  // Relations
  investigators?: Array<{
    id: number;
    investigatorId: number;
    findings: string | null;
    status: string;
    assignedAt: string;
    submittedAt: string | null;
    investigator: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  
  comments?: Array<{
    id: number;
    content: string;
    createdAt: string;
    user: {
      id: number;
      firstName: string;
      lastName: string;
    };
  }>;
}

export interface Comment {
  id: number;
  ovrReportId: number;
  userId: number;
  comment: string;
  isSystemComment: boolean;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
}
