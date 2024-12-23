import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Inter, Roboto } from "next/font/google";
import localFont from "next/font/local";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const robotoFont = localFont({
  src: "../app/fonts/roboto.ttf",
});
export const openSansFont = localFont({
  src: "../app/fonts/opensans.ttf",
});
export const arialFont = localFont({
  src: "../app/fonts/arial.ttf",
});
