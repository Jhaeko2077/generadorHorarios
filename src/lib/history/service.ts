import { subWeeks } from "date-fns";

import { prisma } from "@/lib/prisma";

export async function getMemberHistoryWarnings(memberId: string, meetingWeekId: string) {
  const week = await prisma.meetingWeek.findUnique({ where: { id: meetingWeekId } });
  if (!week) {
    return {
      sameWeekCount: 0,
      last4WeeksCount: 0,
      last8WeeksCount: 0,
      recentAssignments: [],
    };
  }

  const sameWeekCount = await prisma.assignment.count({
    where: {
      meetingWeekId,
      memberId,
    },
  });

  const last4WeeksCount = await prisma.assignment.count({
    where: {
      memberId,
      meetingWeek: {
        meetingDate: {
          gte: subWeeks(week.meetingDate, 4),
          lt: week.meetingDate,
        },
      },
    },
  });

  const last8WeeksCount = await prisma.assignment.count({
    where: {
      memberId,
      meetingWeek: {
        meetingDate: {
          gte: subWeeks(week.meetingDate, 8),
          lt: week.meetingDate,
        },
      },
    },
  });

  const recentAssignments = await prisma.assignment.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      meetingWeek: {
        select: { meetingDate: true, weekStart: true },
      },
      meetingPart: {
        select: { title: true },
      },
    },
  });

  return {
    sameWeekCount,
    last4WeeksCount,
    last8WeeksCount,
    recentAssignments,
  };
}
