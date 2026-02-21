import { z } from "zod";

export const dateString = z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
  message: "Invalid date",
});

const csvToArray = (val: unknown) => {
  if (typeof val !== "string") return val;
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

export const csvEnumArray = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess(csvToArray, z.array(item));
