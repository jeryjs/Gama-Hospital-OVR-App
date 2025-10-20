// OVR Form Categories and Subcategories - Based on GH 012 B

export interface OVRCategory {
  id: string;
  label: string;
  subcategories: Array<{
    id: string;
    label: string;
  }>;
}

export const OVR_CATEGORIES: OVRCategory[] = [
  {
    id: 'admission_process',
    label: '1. Admission Process',
    subcategories: [
      { id: 'delay_in_admission', label: 'Delay in Admission' },
      { id: 'admission_criteria_not_met', label: 'Admission Criteria Not Met' },
      { id: 'admission_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'medication',
    label: '2. Medication',
    subcategories: [
      { id: 'wrong_drug', label: 'Wrong Drug' },
      { id: 'wrong_time', label: 'Wrong Time' },
      { id: 'wrong_dose', label: 'Wrong Dose' },
      { id: 'wrong_route', label: 'Wrong Route' },
      { id: 'wrong_patient', label: 'Wrong Patient' },
      { id: 'iv_not_given', label: 'I.V. not given' },
      { id: 'expired_drug', label: 'Expired Drug' },
      { id: 'extra_missed_dose', label: 'Extra / Missed Dose' },
      { id: 'incorrect_label', label: 'Incorrect Label' },
      { id: 'allergic_reaction', label: 'Allergic Reaction' },
      { id: 'medication_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'medical_records',
    label: '3. Medical Records',
    subcategories: [
      { id: 'records_unavailable', label: 'Medical Records unavailable' },
      { id: 'loose_file_contents', label: 'Loose File Contents' },
      { id: 'missed_information', label: 'Missed Information' },
      { id: 'wrong_file_delivery', label: 'Wrong File Delivery' },
      { id: 'documentation', label: 'Documentation' },
      { id: 'taken_without_approval', label: 'Taken without approval from Ward' },
      { id: 'info_in_wrong_file', label: 'Information in Wrong File' },
      { id: 'records_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'hospital_acquired_injury',
    label: '4. Hospital Acquired Injury',
    subcategories: [
      { id: 'burns_surgical_burns', label: 'Burns / Surgical Burns' },
      { id: 'bedsores', label: 'Bedsores' },
      { id: 'needle_stick_injury', label: 'Needle Stick Injury' },
      { id: 'hematoma', label: 'Hematoma' },
      { id: 'cuts_bruises', label: 'Cuts / Bruises' },
      { id: 'struck_by_equip', label: 'Struck Against by Equip' },
      { id: 'iv_infiltration', label: 'IV infiltration/Extravasations' },
      { id: 'visitor_accident', label: 'Visitor / Accident' },
      { id: 'injury_others', label: 'Others (Specify)' },
    ],
  },
  {
    id: 'complaints_issues',
    label: '5. Complaints / Issues',
    subcategories: [
      { id: 'patient_visitor_complaint', label: 'Patient/Visitor Complaint' },
      { id: 'medical_issues', label: 'Medical Issues' },
      { id: 'nursing_issue', label: 'Nursing Issue' },
      { id: 'administrative_issue', label: 'Administrative Issue' },
      { id: 'food_service', label: 'Food Service' },
      { id: 'housekeeping_service', label: 'Housekeeping Service' },
      { id: 'complaints_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'discharge_process',
    label: '6. Discharge Process',
    subcategories: [
      { id: 'absconded', label: 'Absconded' },
      { id: 'delay_in_discharge', label: 'Delay in Discharge' },
      { id: 'walked_out', label: 'Walked out (ER/OPD)' },
      { id: 'wrong_baby', label: 'Wrong Baby' },
      { id: 'discharge_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'radiology',
    label: '7. Radiology',
    subcategories: [
      { id: 'contrast_reaction', label: 'Contrast Reaction' },
      { id: 'long_waiting_time', label: 'Long Waiting Time' },
      { id: 'incorrect_patient_radiology', label: 'Incorrect Patient' },
      { id: 'postponed_without_notice', label: 'Postponed without Prior Notice' },
      { id: 'radiology_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'blood_products',
    label: '8. Blood & Blood Products',
    subcategories: [
      { id: 'transfusion_reaction', label: 'Transfusion Reaction' },
      { id: 'delay_in_administration', label: 'Delay in Administration' },
      { id: 'wrong_blood_transfused', label: 'Wrong blood product transfused' },
      { id: 'wrong_blood_issued', label: 'Wrong blood issued' },
      { id: 'inappropriate_storage', label: 'Inappropriate Storage' },
      { id: 'blood_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'equipments_supplies',
    label: '9. Equipments / Supplies',
    subcategories: [
      { id: 'improper_handling', label: 'Improper handling' },
      { id: 'not_available', label: 'Not Available' },
      { id: 'missing_damaged', label: 'Missing / Damaged' },
      { id: 'wrong_equipment', label: 'Wrong Equipment' },
      { id: 'failure_malfunction', label: 'Failure / Malfunction' },
      { id: 'improper_storage', label: 'Improper Storage' },
      { id: 'equipment_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'security_variance',
    label: '10. Security Variance',
    subcategories: [
      { id: 'theft_loss', label: 'Theft/ loss personal belonging' },
      { id: 'fighting', label: 'Patient / Visitor fighting' },
      { id: 'non_compliance', label: 'Non compliance to Hospital Policy' },
      { id: 'suicide_attempt', label: 'Suicide Attempt' },
      { id: 'security_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'fire_safety',
    label: '11. Fire / Safety',
    subcategories: [
      { id: 'fire', label: 'Fire' },
      { id: 'chemical_spill', label: 'Chemical Spill' },
      { id: 'blocked_exit', label: 'Blocked Exit' },
      { id: 'expired_extinguisher', label: 'Expired Extinguisher' },
      { id: 'water_leak', label: 'Water Leak' },
      { id: 'gas_leak', label: 'Gas Leak' },
      { id: 'property_damage', label: 'Property Damage' },
      { id: 'unsafe_wires', label: 'Unsafe Electric Wires' },
      { id: 'no_smoking_violation', label: 'NO SMOKING Policy not adhered' },
      { id: 'safety_others', label: 'Others (Specify)' },
    ],
  },
  {
    id: 'falls_injury',
    label: '12. Falls / Injury',
    subcategories: [
      { id: 'found_on_floor', label: 'Patient Found on Floor' },
      { id: 'fall_from_bed', label: 'Patient Fall From Bed' },
      { id: 'alleged_fall', label: 'Alleged Fall' },
      { id: 'ambulating_unassisted', label: 'Ambulating Unassisted' },
      { id: 'ambulating_assisted', label: 'Ambulating Assisted' },
      { id: 'in_bathroom', label: 'In Bathroom' },
      { id: 'staff_fall', label: 'Staff' },
      { id: 'falls_others', label: 'Others (Specify)' },
    ],
  },
  {
    id: 'operating_room',
    label: '13. Operating Room',
    subcategories: [
      { id: 'return_to_or_same_day', label: 'Return to OR Same Day' },
      { id: 'foreign_body', label: 'Foreign body left in patient' },
      { id: 'wrong_site', label: 'Wrong site operated' },
      { id: 'delayed_surgery', label: 'Delayed Surgery' },
      { id: 'cancellation', label: 'Cancellation of Surgery' },
      { id: 'unplanned_repair', label: 'Unplanned repair of organ' },
      { id: 'unplanned_removal', label: 'Unplanned removal of organ' },
      { id: 'complications', label: 'Complications (Anesthesia/surgery)' },
      { id: 'incorrect_patient_or', label: 'Incorrect patient' },
      { id: 'additional_procedure', label: 'Additional Procedure' },
      { id: 'incorrect_instrument_count', label: 'Incorrect Instrument Count' },
      { id: 'incorrect_sponge_count', label: 'Incorrect Sponge Count' },
      { id: 'or_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'laboratory',
    label: '14. Laboratory',
    subcategories: [
      { id: 'mislabeled_specimen', label: 'Mislabeled Specimen' },
      { id: 'unlabeled_specimen', label: 'Unlabeled Specimen' },
      { id: 'late_specimen', label: 'Late Specimen' },
      { id: 'wrong_lab_results', label: 'Wrong Lab. Results' },
      { id: 'delay_critical_results', label: 'Delay in Reporting Critical / Panic Results' },
      { id: 'wrong_specimen', label: 'Wrong Specimen' },
      { id: 'rejected_specimen', label: 'Rejected Specimen' },
      { id: 'lab_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'medical_care_treatment',
    label: '15. Medical Care / Treatment Aspects',
    subcategories: [
      { id: 'no_delay_response', label: 'No / Delay response to call' },
      { id: 'irregular_rounds', label: 'Irregular rounds / follow up' },
      { id: 'delayed_procedure', label: 'Delayed Procedure' },
      { id: 'returned_to_icu', label: 'Returned to ICU same day' },
      { id: 'unplanned_icu_transfer', label: 'Unplanned ICU Transfer' },
      { id: 'failure_screen_pregnancy', label: 'Failure to screen pregnancy' },
      { id: 'incorrect_missing_id_band', label: 'Incorrect / Missing ID Band' },
      { id: 'policies_forms', label: 'Policies & Forms' },
      { id: 'treatment_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'breaks_std_precautions',
    label: '16. Breaks in Std Precautions',
    subcategories: [
      { id: 'toxic_exposure', label: 'Toxic/ hazardous Materials exposure' },
      { id: 'splash_exposure', label: 'Splash (Blood / body Fluids)' },
      { id: 'break_sterile', label: 'Break in Sterile Techniques' },
      { id: 'infectious_disease', label: 'Infectious Disease Exposure' },
      { id: 'precautions_others', label: 'Others (specify)' },
    ],
  },
  {
    id: 'behavioral',
    label: '17. Behavioral',
    subcategories: [
      { id: 'verbal_aggression', label: 'Verbal Aggression' },
      { id: 'assault', label: 'Assault' },
      { id: 'violent_behavior', label: 'Violent Behavior' },
      { id: 'behavioral_others', label: 'Others (Specify)' },
    ],
  },
  {
    id: 'confidentiality_privacy',
    label: '18. Confidentiality & Privacy',
    subcategories: [
      { id: 'unauthorized_patient_file', label: 'Unauthorized access to patient file' },
      { id: 'unauthorized_hospital_files', label: 'Unauthorized access to Hospital confidential files' },
      { id: 'breach_patient_privacy', label: 'Breach in Patient\'s Privacy' },
      { id: 'breach_staff_confidentiality', label: 'Breach in staff confidentiality of information' },
      { id: 'public_display', label: 'Public display of Patient Information' },
      { id: 'privacy_others', label: 'Others (specify)' },
    ],
  },
];

export interface CauseClassification {
  id: string;
  label: string;
}

export const CAUSE_CLASSIFICATIONS: CauseClassification[] = [
  { id: '1', label: 'Absence of Policy' },
  { id: '2', label: 'Policy not Implemented' },
  { id: '3', label: 'Lack of Understanding' },
  { id: '4', label: 'Lack of Communication' },
  { id: '5', label: 'Negligence' },
  { id: '6', label: 'Materials / supply shortage' },
  { id: '7', label: 'Materials / Supply poor quality' },
  { id: '8', label: 'Shortage of Equipment' },
  { id: '9', label: 'Equipment Malfunction' },
  { id: '10', label: 'Others (Specify)' },
];

export const SEVERITY_LEVELS = [
  { value: 'near_miss_level_1', label: 'Near Miss (Level 1)', color: '#10B981' },
  { value: 'no_apparent_injury_level_2', label: 'No Apparent injury (Level 2)', color: '#3B82F6' },
  { value: 'minor_level_3', label: 'Minor (Level 3)', color: '#F59E0B' },
  { value: 'major_level_4', label: 'Major (Level 4)', color: '#EF4444' },
];

export const INJURY_OUTCOMES = [
  { value: 'no_injury', label: 'No Injury' },
  { value: 'minor', label: 'Minor' },
  { value: 'serious', label: 'Serious' },
  { value: 'death', label: 'Death' },
];

export const PERSON_INVOLVED_OPTIONS = [
  { value: 'patient', label: 'Patient' },
  { value: 'staff', label: 'Staff' },
  { value: 'visitor_watcher', label: 'Visitor/ Watcher' },
  { value: 'others', label: 'Others' },
];
