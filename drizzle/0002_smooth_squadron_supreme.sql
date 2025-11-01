ALTER TYPE "public"."injury_outcome" ADD VALUE '' BEFORE 'no_injury';--> statement-breakpoint
ALTER TYPE "public"."severity_level" ADD VALUE '' BEFORE 'near_miss_level_1';--> statement-breakpoint
ALTER TABLE "ovr_reports" RENAME COLUMN "reference_number" TO "ref_no";--> statement-breakpoint
ALTER TABLE "ovr_reports" RENAME COLUMN "staff_position" TO "staff_involved_position";--> statement-breakpoint
ALTER TABLE "ovr_reports" RENAME COLUMN "staff_employee_id" TO "staff_involved_employee_id";--> statement-breakpoint
ALTER TABLE "ovr_reports" RENAME COLUMN "staff_department" TO "staff_involved_department";--> statement-breakpoint
ALTER TABLE "ovr_reports" DROP CONSTRAINT "ovr_reports_reference_number_unique";--> statement-breakpoint
ALTER TABLE "ovr_reports" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ovr_reports" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."ovr_status";--> statement-breakpoint
CREATE TYPE "public"."ovr_status" AS ENUM('draft', 'submitted', 'supervisor_approved', 'hod_assigned', 'qi_final_review', 'closed');--> statement-breakpoint
ALTER TABLE "ovr_reports" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."ovr_status";--> statement-breakpoint
ALTER TABLE "ovr_reports" ALTER COLUMN "status" SET DATA TYPE "public"."ovr_status" USING "status"::"public"."ovr_status";--> statement-breakpoint
ALTER TABLE "ovr_comments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD COLUMN "occurrence_detail" varchar(100);--> statement-breakpoint
ALTER TABLE "ovr_reports" ADD CONSTRAINT "ovr_reports_ref_no_unique" UNIQUE("ref_no");