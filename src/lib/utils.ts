import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

const APP_TIMEZONE = "Asia/Kolkata";

function getDatePartsInTimezone(date: Date, timeZone: string = APP_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

function formatISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function toISODate(date: Date = new Date()): string {
  const { year, month, day } = getDatePartsInTimezone(date);
  return formatISODate(year, month, day);
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return formatISODate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function getMonthRange(date = new Date()) {
  const { year, month } = getDatePartsInTimezone(date);
  const start = formatISODate(year, month, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const end = formatISODate(year, month, lastDay);
  return { start, end };
}

export function getLastMonthRange(date = new Date()) {
  const { year, month } = getDatePartsInTimezone(date);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const start = formatISODate(prevYear, prevMonth, 1);
  const lastDay = new Date(prevYear, prevMonth, 0).getDate();
  const end = formatISODate(prevYear, prevMonth, lastDay);
  return { start, end };
}

export function getWeekRange(date = new Date()) {
  const { year, month, day } = getDatePartsInTimezone(date);
  const current = new Date(year, month - 1, day);
  const dayOfWeek = current.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startDate = new Date(year, month - 1, day + mondayOffset);
  const endDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate() + 6
  );
  return {
    start: formatISODate(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      startDate.getDate()
    ),
    end: formatISODate(
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate()
    ),
  };
}
