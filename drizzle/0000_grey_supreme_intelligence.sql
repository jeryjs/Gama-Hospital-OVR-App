CREATE TYPE "public"."injury_outcome" AS ENUM('no_injury', 'minor', 'serious', 'death');--> statement-breakpoint
CREATE TYPE "public"."ovr_status" AS ENUM('draft', 'submitted', 'supervisor_review', 'qi_review', 'hod_review', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."person_involved" AS ENUM('patient', 'staff', 'visitor_watcher', 'others');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'quality_manager', 'department_head', 'supervisor', 'employee');--> statement-breakpoint
CREATE TYPE "public"."severity_level" AS ENUM('near_miss_level_1', 'no_apparent_injury_level_2', 'minor_level_3', 'major_level_4');--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"head_of_department" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"department_id" integer,
	"building" varchar(100),
	"floor" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "locations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ovr_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ovr_report_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar(100),
	"file_size" integer,
	"uploaded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ovr_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ovr_report_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"comment" text NOT NULL,
	"is_system_comment" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ovr_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_number" varchar(50),
	"occurrence_date" date NOT NULL,
	"occurrence_time" time NOT NULL,
	"location_id" integer,
	"specific_location" text,
	"patient_name" varchar(255),
	"patient_mrn" varchar(100),
	"patient_age" integer,
	"patient_sex" varchar(20),
	"patient_unit" varchar(100),
	"person_involved" "person_involved" NOT NULL,
	"is_sentinel_event" boolean DEFAULT false,
	"sentinel_event_details" text,
	"staff_involved_id" integer,
	"staff_involved_name" varchar(255),
	"staff_position" varchar(100),
	"staff_employee_id" varchar(50),
	"staff_department" varchar(100),
	"occurrence_category" varchar(50) NOT NULL,
	"occurrence_subcategory" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"reporter_id" integer NOT NULL,
	"reporter_department" varchar(100),
	"reporter_position" varchar(100),
	"witness_name" varchar(255),
	"witness_account" text,
	"witness_department" varchar(100),
	"witness_position" varchar(100),
	"witness_employee_id" varchar(50),
	"physician_notified" boolean DEFAULT false,
	"physician_saw_patient" boolean DEFAULT false,
	"assessment" text,
	"diagnosis" text,
	"injury_outcome" "injury_outcome",
	"treatment_provided" text,
	"physician_name" varchar(255),
	"physician_id" varchar(50),
	"supervisor_id" integer,
	"supervisor_action" text,
	"supervisor_action_date" timestamp,
	"department_head_id" integer,
	"problems_identified" text,
	"cause_classification" varchar(50),
	"cause_details" text,
	"prevention_recommendation" text,
	"hod_action_date" timestamp,
	"qi_received_by" integer,
	"qi_received_date" timestamp,
	"qi_feedback" text,
	"qi_form_complete" boolean,
	"qi_proper_cause_identified" boolean,
	"qi_proper_timeframe" boolean,
	"qi_action_complies_standards" boolean,
	"qi_effective_corrective_action" boolean,
	"severity_level" "severity_level",
	"status" "ovr_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"resolved_at" timestamp,
	"closed_at" timestamp,
	CONSTRAINT "ovr_reports_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"google_id" varchar(255),
	"employee_id" varchar(50),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" "role" DEFAULT 'employee' NOT NULL,
	"department" varchar(100),
	"position" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"profile_picture" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_of_department_users_id_fk" FOREIGN KEY ("head_of_department") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_attachments" ADD CONSTRAINT "ovr_attachments_ovr_report_id_ovr_reports_id_fk" FOREIGN KEY ("ovr_report_id") REFERENCES "public"."ovr_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_attachments" ADD CONSTRAINT "ovr_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_comments" ADD CONSTRAINT "ovr_comments_ovr_report_id_ovr_reports_id_fk" FOREIGN KEY ("ovr_report_id") REFERENCES "public"."ovr_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_comments" ADD CONSTRAINT "ovr_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_staff_involved_id_users_id_fk" FOREIGN KEY ("staff_involved_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_department_head_id_users_id_fk" FOREIGN KEY ("department_head_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_qi_received_by_users_id_fk" FOREIGN KEY ("qi_received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;