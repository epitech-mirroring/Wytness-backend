-- AlterTable
ALTER TABLE "WorkflowNode" ADD COLUMN     "config" JSONB NOT NULL DEFAULT '{}';
