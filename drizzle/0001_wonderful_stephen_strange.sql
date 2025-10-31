CREATE TABLE "ovr_investigators" (
	"id" serial PRIMARY KEY NOT NULL,
	"ovr_report_id" integer NOT NULL,
	"investigator_id" integer NOT NULL,
	"assigned_by" integer NOT NULL,
	"findings" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ovr_reports" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ovr_reports" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."ovr_status";--> statement-breakpoint
CREATE TYPE "public"."ovr_status" AS ENUM('draft', 'submitted', 'supervisor_approved', 'qi_review', 'hod_assigned', 'qi_final_review', 'closed');--> statement-breakpoint
ALTER TABLE "ovr_reports" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."ovr_status";--> statement-breakpoint
ALTER TABLE "ovr_reports" ALTER COLUMN "status" SET DATA TYPE "public"."ovr_status" USING "status"::"public"."ovr_status";--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD COLUMN "supervisor_approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD COLUMN "qi_assigned_by" integer;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD COLUMN "qi_assigned_date" timestamp;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD COLUMN "hod_assigned_at" timestamp;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD COLUMN "investigation_findings" text;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD COLUMN "hod_submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "ovr_investigators" ADD CONSTRAINT "ovr_investigators_ovr_report_id_ovr_reports_id_fk" FOREIGN KEY ("ovr_report_id") REFERENCES "public"."ovr_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_investigators" ADD CONSTRAINT "ovr_investigators_investigator_id_users_id_fk" FOREIGN KEY ("investigator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_investigators" ADD CONSTRAINT "ovr_investigators_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_qi_assigned_by_users_id_fk" FOREIGN KEY ("qi_assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;