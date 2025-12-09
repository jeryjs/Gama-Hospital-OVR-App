CREATE TYPE "public"."injury_outcome" AS ENUM('no_injury', 'minor', 'serious', 'death');--> statement-breakpoint
CREATE TYPE "public"."level_of_harm" AS ENUM('med_a', 'med_b', 'med_c', 'med_d', 'med_e', 'med_f', 'med_g', 'med_h', 'med_i', 'near_miss', 'none', 'minor', 'moderate', 'major', 'catastrophic');--> statement-breakpoint
CREATE TYPE "public"."ovr_status" AS ENUM('draft', 'submitted', 'qi_review', 'investigating', 'qi_final_actions', 'closed');--> statement-breakpoint
CREATE TYPE "public"."person_involved" AS ENUM('patient', 'staff', 'visitor_watcher', 'others');--> statement-breakpoint
CREATE TYPE "public"."severity_level" AS ENUM('near_miss', 'no_apparent_injury', 'minor', 'major');--> statement-breakpoint
CREATE TYPE "public"."treatment_type" AS ENUM('first_aid', 'sutures', 'observation', 'bloodwork', 'radiology', 'hospitalized', 'transferred');--> statement-breakpoint
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
	"ovr_report_id" varchar(20) NOT NULL,
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
	"ovr_report_id" varchar(20) NOT NULL,
	"user_id" integer NOT NULL,
	"comment" text NOT NULL,
	"is_system_comment" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ovr_corrective_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ovr_report_id" varchar(20) NOT NULL,
	"assigned_to" integer[] NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"checklist" text NOT NULL,
	"action_taken" text,
	"evidence_files" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"closed_by" integer,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ovr_investigations" (
	"id" serial PRIMARY KEY NOT NULL,
	"ovr_report_id" varchar(20) NOT NULL,
	"investigator_ids" integer[] NOT NULL,
	"findings" text,
	"problems_identified" text,
	"cause_classification" varchar(50),
	"cause_details" text,
	"corrective_action_plan" text,
	"rca_analysis" text,
	"fishbone_analysis" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ovr_reports" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"occurrence_date" date NOT NULL,
	"occurrence_time" time NOT NULL,
	"location_id" integer,
	"specific_location" text,
	"person_involved" "person_involved" NOT NULL,
	"involved_person_name" varchar(255),
	"involved_person_age" integer,
	"involved_person_sex" varchar(20),
	"involved_person_unit" varchar(100),
	"involved_person_mrn" varchar(100),
	"involved_staff_id" integer,
	"involved_person_employee_id" varchar(50),
	"involved_person_position" varchar(100),
	"involved_person_relation" varchar(100),
	"involved_person_contact" varchar(100),
	"is_sentinel_event" boolean DEFAULT false,
	"sentinel_event_details" text,
	"occurrence_category" varchar(50) NOT NULL,
	"occurrence_subcategory" varchar(100) NOT NULL,
	"occurrence_detail" varchar(100),
	"description" text NOT NULL,
	"level_of_harm" "level_of_harm",
	"reporter_id" integer NOT NULL,
	"reporter_department" varchar(100),
	"reporter_position" varchar(100),
	"physician_notified" boolean DEFAULT false,
	"physician_saw_patient" boolean DEFAULT false,
	"assessment" text,
	"diagnosis" text,
	"injury_outcome" "injury_outcome",
	"treatment_types" text[],
	"hospitalized_details" varchar(255),
	"treatment_provided" text,
	"physician_name" varchar(255),
	"physician_id" varchar(50),
	"physician_signature_date" timestamp,
	"risk_impact" integer,
	"risk_likelihood" integer,
	"risk_score" integer,
	"supervisor_notified" boolean,
	"supervisor_id" integer,
	"supervisor_action" text,
	"qi_received_by" integer,
	"qi_received_date" timestamp,
	"qi_assigned_by" integer,
	"qi_assigned_date" timestamp,
	"qi_approved_by" integer,
	"qi_approved_at" timestamp,
	"qi_rejection_reason" text,
	"qi_feedback" text,
	"qi_form_complete" boolean,
	"qi_proper_cause_identified" boolean,
	"qi_proper_timeframe" boolean,
	"qi_action_complies_standards" boolean,
	"qi_effective_corrective_action" boolean,
	"severity_level" "severity_level",
	"case_review" text,
	"reporter_feedback" text,
	"closed_by" integer,
	"closed_at" timestamp,
	"status" "ovr_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ovr_shared_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_type" varchar(30) NOT NULL,
	"resource_id" integer NOT NULL,
	"ovr_report_id" varchar(20) NOT NULL,
	"email" varchar(255) NOT NULL,
	"user_id" integer,
	"role" varchar(30) NOT NULL,
	"access_token" varchar(64) NOT NULL,
	"token_expires_at" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"last_accessed_at" timestamp,
	"invited_by" integer NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"revoked_by" integer,
	"revoked_at" timestamp,
	CONSTRAINT "ovr_shared_access_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"azure_id" varchar(255),
	"employee_id" varchar(50),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"roles" text[] DEFAULT ARRAY['employee']::text[] NOT NULL,
	"department" varchar(100),
	"position" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"profile_picture" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_azure_id_unique" UNIQUE("azure_id"),
	CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_of_department_users_id_fk" FOREIGN KEY ("head_of_department") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_attachments" ADD CONSTRAINT "ovr_attachments_ovr_report_id_ovr_reports_id_fk" FOREIGN KEY ("ovr_report_id") REFERENCES "public"."ovr_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_attachments" ADD CONSTRAINT "ovr_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_comments" ADD CONSTRAINT "ovr_comments_ovr_report_id_ovr_reports_id_fk" FOREIGN KEY ("ovr_report_id") REFERENCES "public"."ovr_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_comments" ADD CONSTRAINT "ovr_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_corrective_actions" ADD CONSTRAINT "ovr_corrective_actions_ovr_report_id_ovr_reports_id_fk" FOREIGN KEY ("ovr_report_id") REFERENCES "public"."ovr_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_corrective_actions" ADD CONSTRAINT "ovr_corrective_actions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_corrective_actions" ADD CONSTRAINT "ovr_corrective_actions_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_investigations" ADD CONSTRAINT "ovr_investigations_ovr_report_id_ovr_reports_id_fk" FOREIGN KEY ("ovr_report_id") REFERENCES "public"."ovr_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_investigations" ADD CONSTRAINT "ovr_investigations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_involved_staff_id_users_id_fk" FOREIGN KEY ("involved_staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_qi_received_by_users_id_fk" FOREIGN KEY ("qi_received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_qi_assigned_by_users_id_fk" FOREIGN KEY ("qi_assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_qi_approved_by_users_id_fk" FOREIGN KEY ("qi_approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_shared_access" ADD CONSTRAINT "ovr_shared_access_ovr_report_id_ovr_reports_id_fk" FOREIGN KEY ("ovr_report_id") REFERENCES "public"."ovr_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_shared_access" ADD CONSTRAINT "ovr_shared_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_shared_access" ADD CONSTRAINT "ovr_shared_access_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_shared_access" ADD CONSTRAINT "ovr_shared_access_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ovr_shared_access_resource_idx" ON "ovr_shared_access" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "ovr_shared_access_token_idx" ON "ovr_shared_access" USING btree ("access_token");--> statement-breakpoint
CREATE INDEX "ovr_shared_access_email_idx" ON "ovr_shared_access" USING btree ("email");