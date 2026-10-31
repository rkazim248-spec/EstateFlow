import { z } from "zod";

import {
  AREA_UNITS,
  CLIENT_PURPOSES,
  CLIENT_STATUSES,
  PRICE_UNITS,
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  budgetUnitsForPurpose,
  priceUnitsForPurpose,
  typeUsesBedrooms,
} from "./constants";

/**
 * Accepts Pakistani mobile numbers (`+92 300 1234567`, `0300-1234567`,
 * `0092 300 1234567`) as well as general international numbers. It does not
 * assume the number belongs to a particular person or operator.
 */
export function isPhoneNumber(value: string): boolean {
  const compact = value.replace(/[\s\-().]/g, "");
  if (!compact) return false;
  if (/^(?:\+92|0092|0)?3\d{9}$/.test(compact)) return true;
  if (/^\+?\d{8,15}$/.test(compact)) return true;
  return false;
}

function numericString(label: string, unitHint?: string) {
  return z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .refine((value) => !Number.isNaN(Number(value)), `Enter a valid ${label}.`)
    .refine(
      (value) => Number(value) > 0,
      `The ${label} must be greater than 0${unitHint ? ` ${unitHint}` : ""}.`,
    );
}

export const propertyFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter the property name.")
      .max(120, "Keep the name under 120 characters."),
    purpose: z.enum(PROPERTY_PURPOSES),
    type: z.enum(PROPERTY_TYPES),
    bedrooms: z.string().default(""),
    customBedrooms: z.string().trim().max(160, "Keep this under 160 characters.").default(""),
    area: numericString("area"),
    areaUnit: z.enum(AREA_UNITS),
    price: numericString("price"),
    priceUnit: z.enum(PRICE_UNITS),
    location: z
      .string()
      .trim()
      .min(1, "Enter the property location.")
      .max(160, "Keep the location under 160 characters."),
    status: z.enum(PROPERTY_STATUSES),
    ownerName: z.string().trim().max(120, "Keep the name under 120 characters.").default(""),
    ownerPhone: z
      .string()
      .trim()
      .max(30, "Keep the phone number under 30 characters.")
      .default("")
      .refine(
        (value) => value === "" || isPhoneNumber(value),
        "Enter a valid phone number, for example +92 300 1234567.",
      ),
    ownerCondition: z.string().trim().max(2000, "Keep conditions under 2,000 characters.").default(""),
  })
  .superRefine((values, ctx) => {
    if (typeUsesBedrooms(values.type)) {
      if (!values.bedrooms) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bedrooms"],
          message: "Select a bedroom configuration, or choose Custom.",
        });
      }
      if (values.bedrooms === "Custom" && !values.customBedrooms.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customBedrooms"],
          message: "Describe the bedroom configuration.",
        });
      }
    }
    if (!priceUnitsForPurpose(values.purpose).includes(values.priceUnit as never)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priceUnit"],
        message: "Choose a price unit that matches the property purpose.",
      });
    }
  });

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export const clientFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter the client's name.")
      .max(120, "Keep the name under 120 characters."),
    phone: z
      .string()
      .trim()
      .min(1, "Enter the client's phone number.")
      .max(30, "Keep the phone number under 30 characters.")
      .refine(
        (value) => isPhoneNumber(value),
        "Enter a valid phone number, for example +92 300 1234567.",
      ),
    purpose: z.enum(CLIENT_PURPOSES),
    type: z.enum(PROPERTY_TYPES),
    bedrooms: z.string().default(""),
    customBedrooms: z.string().trim().max(160, "Keep this under 160 characters.").default(""),
    budget: numericString("budget"),
    budgetUnit: z.enum(PRICE_UNITS),
    location: z
      .string()
      .trim()
      .min(1, "Enter the preferred location.")
      .max(160, "Keep the location under 160 characters."),
    requirements: z.string().trim().max(2000, "Keep requirements under 2,000 characters.").default(""),
    condition: z.string().trim().max(2000, "Keep conditions under 2,000 characters.").default(""),
    status: z.enum(CLIENT_STATUSES),
  })
  .superRefine((values, ctx) => {
    if (typeUsesBedrooms(values.type)) {
      if (!values.bedrooms) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bedrooms"],
          message: "Select a bedroom preference, or choose Custom.",
        });
      }
      if (values.bedrooms === "Custom" && !values.customBedrooms.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customBedrooms"],
          message: "Describe the bedroom requirement.",
        });
      }
    }
    if (!budgetUnitsForPurpose(values.purpose).includes(values.budgetUnit as never)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetUnit"],
        message: "Choose a budget unit that matches the client's purpose.",
      });
    }
  });

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter your full name.")
      .max(120, "Keep your name under 120 characters."),
    email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    confirmPassword: z.string().min(1, "Re-enter your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
export type SignupValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(120, "Keep your name under 120 characters."),
});
export type ProfileValues = z.infer<typeof profileSchema>;
