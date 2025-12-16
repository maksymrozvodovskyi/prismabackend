import dotenv from "dotenv";

dotenv.config();

type DefaultValue = string | number;

export function getEnvVar(name: string, defaultValue?: DefaultValue): string {
  const value = process.env[name];

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (defaultValue !== undefined) {
    return String(defaultValue);
  }

  throw new Error(`Missing: process.env['${name}']`);
}
