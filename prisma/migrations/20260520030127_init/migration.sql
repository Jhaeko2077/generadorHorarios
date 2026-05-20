-- CreateEnum
CREATE TYPE "MeetingWeekStatus" AS ENUM ('draft', 'completed', 'exported');

-- CreateEnum
CREATE TYPE "MeetingSection" AS ENUM ('TESOROS', 'MAESTROS', 'VIDA_CRISTIANA', 'OTROS');

-- CreateEnum
CREATE TYPE "AssignmentMode" AS ENUM ('single', 'two_rooms_single_person', 'two_rooms_pair', 'conductor_reader', 'none');

-- CreateEnum
CREATE TYPE "AssignmentRoom" AS ENUM ('SALA_1', 'SALA_2', 'SALA_B', 'GENERAL');

-- CreateTable
CREATE TABLE "Congregation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Congregation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefixNumber" INTEGER NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberCategory" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingWeek" (
    "id" TEXT NOT NULL,
    "congregationId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT,
    "bibleReading" TEXT,
    "openingSong" TEXT,
    "middleSong" TEXT,
    "closingSong" TEXT,
    "status" "MeetingWeekStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingPart" (
    "id" TEXT NOT NULL,
    "meetingWeekId" TEXT NOT NULL,
    "section" "MeetingSection" NOT NULL,
    "partNumber" INTEGER,
    "title" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "reference" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "requiresTwoRooms" BOOLEAN NOT NULL DEFAULT false,
    "assignmentMode" "AssignmentMode" NOT NULL DEFAULT 'single',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "meetingWeekId" TEXT NOT NULL,
    "meetingPartId" TEXT,
    "role" TEXT NOT NULL,
    "room" "AssignmentRoom",
    "memberId" TEXT NOT NULL,
    "memberCodeSnapshot" TEXT NOT NULL,
    "memberNameSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportLog" (
    "id" TEXT NOT NULL,
    "meetingWeekId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Congregation_code_key" ON "Congregation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Group_prefixNumber_key" ON "Group"("prefixNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Member_code_key" ON "Member"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MemberCategory_memberId_categoryId_key" ON "MemberCategory"("memberId", "categoryId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCategory" ADD CONSTRAINT "MemberCategory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCategory" ADD CONSTRAINT "MemberCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingWeek" ADD CONSTRAINT "MeetingWeek_congregationId_fkey" FOREIGN KEY ("congregationId") REFERENCES "Congregation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingPart" ADD CONSTRAINT "MeetingPart_meetingWeekId_fkey" FOREIGN KEY ("meetingWeekId") REFERENCES "MeetingWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_meetingWeekId_fkey" FOREIGN KEY ("meetingWeekId") REFERENCES "MeetingWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_meetingPartId_fkey" FOREIGN KEY ("meetingPartId") REFERENCES "MeetingPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_meetingWeekId_fkey" FOREIGN KEY ("meetingWeekId") REFERENCES "MeetingWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
