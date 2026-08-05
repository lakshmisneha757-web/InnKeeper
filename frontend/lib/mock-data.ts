export type ReservationSummary = {
  guestName: string;
  confirmationNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  roomRate: number;
  taxes: number;
  incidentalHold: number;
  hotelName: string;
  roomNumber: string;
  checkoutTime: string;
};

// In production this comes from `GET /api/guest/checkin/:token` (see
// app/api/guest/checkin/[token]/route.ts), backed by the Reservation table
// in prisma/schema.prisma. Hardcoded here so the UI is fully explorable
// without a database connection.
export const RESERVATION: ReservationSummary = {
  guestName: "Miguel Santos",
  confirmationNumber: "INK-48213",
  roomType: "Queen Deluxe, Poolside",
  checkIn: "Jul 29, 2026",
  checkOut: "Jul 31, 2026",
  guests: 2,
  nights: 2,
  roomRate: 89.0,
  taxes: 14.24,
  incidentalHold: 50.0,
  hotelName: "InnKeeper Motor Lodge",
  roomNumber: "214",
  checkoutTime: "11:00 AM, Jul 31",
};

export const money = (n: number) => `$${n.toFixed(2)}`;

export const STEPS = [
  { key: "welcome", label: "Reservation", path: "" },
  { key: "verify", label: "Identity", path: "/verify" },
  { key: "payment", label: "Payment", path: "/payment" },
  { key: "review", label: "Review", path: "/review" },
  { key: "success", label: "Complete", path: "/success" },
  { key: "key", label: "Room Key", path: "/key" },
] as const;
