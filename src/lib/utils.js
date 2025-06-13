import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatNumberInput(value) {
  if (!value) return "";
  const numericValue = value.replace(/[^0-9]/g, "");
  if (numericValue === "") return "";
  return Number(numericValue).toLocaleString('id-ID');
}

export function parseFormattedNumber(value) {
  if (!value) return "";
  return value.replace(/\./g, "");
}