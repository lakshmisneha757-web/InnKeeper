import { z } from "zod";

export const vehicleFormSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  licensePlate: z.string().min(1),
  state: z.string().min(1),
  parkingSlot: z.string().optional().or(z.literal("")),
});

export type VehicleForm = z.infer<typeof vehicleFormSchema>;

export const paymentFormSchema = z.object({
  reservationId: z.string().min(1).optional().or(z.literal("")),
  amount: z.coerce.number().min(0),
  method: z.string().optional().or(z.literal("Credit Card")),
  paymentStatus: z.string().optional().or(z.literal("Pending")),
  notes: z.string().optional().or(z.literal("")),
});

export type PaymentForm = z.infer<typeof paymentFormSchema>;

export const ledgerFormSchema = z.object({
  employeeName: z.string().min(1),
  openingCash: z.coerce.number().min(0).default(0),
  closingCash: z.coerce.number().min(0).default(0),
  status: z.string().optional().or(z.literal("open")),
  notes: z.string().optional().or(z.literal("")),
});

export type LedgerForm = z.infer<typeof ledgerFormSchema>;

export const shiftAuditFormSchema = ledgerFormSchema.extend({});
export type ShiftAuditForm = z.infer<typeof shiftAuditFormSchema>;
