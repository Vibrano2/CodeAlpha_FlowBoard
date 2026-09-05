-- FlowBoard uses its Express API and Prisma connection as the sole data-access
-- layer. RLS without client policies prevents the Supabase Data API roles from
-- bypassing the application's authorization checks.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "boards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- Cover foreign keys used by joins and referential integrity checks.
CREATE INDEX "activity_logs_actor_id_idx" ON "activity_logs"("actor_id");
CREATE INDEX "tasks_created_by_idx" ON "tasks"("created_by");
CREATE INDEX "notifications_project_id_idx" ON "notifications"("project_id");
CREATE INDEX "notifications_task_id_idx" ON "notifications"("task_id");
