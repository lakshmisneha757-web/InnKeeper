import { CheckInProvider } from "@/components/checkin/CheckInProvider";

// This layout stays mounted while the guest navigates between
// /checkin/[token], /verify, /payment, /review, /success, and /key, so the
// CheckInProvider context (identity/payment progress) survives client-side
// navigation. A hard page refresh re-derives progress from the server via
// each screen's own data fetch rather than trusting stale client state.
export default function CheckInLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { token: string };
}) {
  return (
    <div className="min-h-screen bg-slate-50 md:py-6">
      <CheckInProvider token={params.token}>{children}</CheckInProvider>
    </div>
  );
}
