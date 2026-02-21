import { prisma } from "../prisma";
import { ActivityType } from "../../prisma/generated/prisma/index";
import {
  addDays,
  subDays,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";

export type VacationPeriod = {
  days: number;
  startDate: string;
  endDate: string;
};

export async function getVacationPeriodForDate(
  userId: string,
  dateStr: string,
): Promise<VacationPeriod | null> {
  const targetDate = parseISO(dateStr);
  const startRange = subDays(targetDate, 30);
  const endRange = addDays(targetDate, 30);

  const worklogs = await prisma.workLog.findMany({
    where: {
      userId,
      activity: ActivityType.VACATION,
      date: { gte: startRange, lte: endRange },
    },
    select: { date: true },
    orderBy: { date: "asc" },
  });

  if (worklogs.length === 0) return null;

  const sortedDates = worklogs.map((w) => format(w.date, "yyyy-MM-dd"));

  const periods: { startDate: Date; endDate: Date; days: number }[] = [];

  let current: { startDate: Date; endDate: Date; days: number } | null = null;

  for (const d of sortedDates) {
    const logDate = parseISO(d);
    if (!current) {
      current = { startDate: logDate, endDate: logDate, days: 1 };
    } else if (differenceInCalendarDays(logDate, current.endDate) === 1) {
      current.endDate = logDate;
      current.days += 1;
    } else {
      periods.push(current);
      current = { startDate: logDate, endDate: logDate, days: 1 };
    }
  }
  if (current) periods.push(current);

  const target = parseISO(dateStr);

  const period = periods.find(
    (p) => target >= p.startDate && target <= p.endDate,
  );

  if (!period) return null;

  return {
    days: period.days,
    startDate: format(period.startDate, "yyyy-MM-dd"),
    endDate: format(period.endDate, "yyyy-MM-dd"),
  };
}
