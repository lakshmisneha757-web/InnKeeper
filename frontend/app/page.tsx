import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto mb-6 h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">InnKeeper</h1>
        <p className="text-slate-500 mt-2 mb-8">
          This is the guest portal. In production, guests arrive here through the secure link
          texted to them at booking. Use the demo link below to try the mobile check-in flow.
        </p>
        <Link
          href="/checkin/demo-token-123"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Open demo check-in <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
