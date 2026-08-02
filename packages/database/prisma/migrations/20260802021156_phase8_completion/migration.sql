-- AlterTable
ALTER TABLE "teacher_profiles" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PEN',
ADD COLUMN     "hourlyRateCents" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "teacher_earnings" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYOUT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_earnings_classSessionId_key" ON "teacher_earnings"("classSessionId");

-- AddForeignKey
ALTER TABLE "teacher_earnings" ADD CONSTRAINT "teacher_earnings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_earnings" ADD CONSTRAINT "teacher_earnings_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "class_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
