ALTER TABLE "users" ADD COLUMN "azure_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_azure_id_unique" UNIQUE("azure_id");