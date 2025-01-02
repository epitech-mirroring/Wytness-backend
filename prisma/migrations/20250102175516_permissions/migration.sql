-- CreateEnum
CREATE TYPE "Effect" AS ENUM ('ALLOW', 'DENY');

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "effect" "Effect" NOT NULL,
    "resourceType" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserPolicy" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserPolicy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rule_action_resourceType_effect_policyId_key" ON "Rule"("action", "resourceType", "effect", "policyId");

-- CreateIndex
CREATE INDEX "_UserPolicy_B_index" ON "_UserPolicy"("B");

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPolicy" ADD CONSTRAINT "_UserPolicy_A_fkey" FOREIGN KEY ("A") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPolicy" ADD CONSTRAINT "_UserPolicy_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
