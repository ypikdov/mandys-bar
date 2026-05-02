ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "entidad" TEXT,
  ADD COLUMN IF NOT EXISTS "entidad_id" TEXT,
  ADD COLUMN IF NOT EXISTS "datos_anteriores" JSONB,
  ADD COLUMN IF NOT EXISTS "datos_nuevos" JSONB,
  ADD COLUMN IF NOT EXISTS "ip" TEXT,
  ADD COLUMN IF NOT EXISTS "user_agent" TEXT;

CREATE INDEX IF NOT EXISTS "audit_logs_entidad_entidad_id_idx"
  ON "audit_logs" ("entidad", "entidad_id");
