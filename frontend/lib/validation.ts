import { z } from "zod";

// ---------------------------------------------------------------------------
// Luhn algorithm — validates credit-card numbers
// ---------------------------------------------------------------------------
function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// ---------------------------------------------------------------------------
// Detect card network (returns "amex" | "other")
// ---------------------------------------------------------------------------
function isAmex(digits: string): boolean {
  return /^3[47]/.test(digits);
}

// ---------------------------------------------------------------------------
// Payment schema
// ---------------------------------------------------------------------------
export const paymentSchema = z
  .object({
    cardholderName: z
      .string()
      .trim()
      .min(2, "Enter the cardholder's name")
      .regex(/^[a-zA-Z\s\-'.]+$/, "Name should contain letters only"),

    cardNumber: z
      .string()
      .transform((v) => v.replace(/\s/g, ""))
      .refine(
        (v) => /^\d+$/.test(v),
        "Card number must contain digits only"
      )
      .refine(
        (v) => v.length >= 13 && v.length <= 19,
        "Invalid card number length"
      )
      .refine(luhn, "Invalid card number"),

    expiry: z
      .string()
      .regex(/^\d{2}\/\d{2}$/, "Use MM/YY format")
      .superRefine((val, ctx) => {
        const [mmStr, yyStr] = val.split("/");
        const month = parseInt(mmStr, 10);
        const year = parseInt(yyStr, 10) + 2000;

        if (month < 1 || month > 12) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid month — must be 01 to 12",
          });
          return;
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-based

        if (
          year < currentYear ||
          (year === currentYear && month < currentMonth)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Card has expired",
          });
        }
      }),

    cvv: z
      .string()
      .regex(/^\d+$/, "CVV must be digits only"),

    billingZip: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const digits = data.cardNumber.replace(/\s/g, "");
    const amex = isAmex(digits);
    const cvvLen = data.cvv.length;

    if (amex && cvvLen !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cvv"],
        message: "Amex cards require a 4-digit CVV",
      });
    } else if (!amex && cvvLen !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cvv"],
        message: "CVV must be 3 digits",
      });
    }
  });

export type PaymentInput = z.infer<typeof paymentSchema>;

export const policySchema = z.object({
  policyAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the motel policies to continue" }),
  }),
});

export const idUploadSchema = z.object({
  idDocument: z
    .instanceof(File)
    .refine((f) => f.size <= 10 * 1024 * 1024, "File must be 10MB or smaller")
    .refine(
      (f) => ["image/jpeg", "image/png", "image/heic"].includes(f.type),
      "Upload a JPEG, PNG, or HEIC file"
    ),
});
