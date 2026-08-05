import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BedDouble, IndianRupee, Car, CreditCard } from "lucide-react";

function normalizeList(data: any) {
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (data?.items) return data;
  return { items: [], total: 0 };
}

export default function Module5Widgets() {
  const vehiclesQ = useQuery({
    queryKey: ["module5", "vehicles", "summary"],
    queryFn: async () => {
      const { data } = await apiClient.vehicles.list({ limit: 100 });
      return normalizeList(data);
    },
  });

  const paymentsQ = useQuery({
    queryKey: ["module5", "payments", "summary"],
    queryFn: async () => {
      const { data } = await apiClient.payments.list({ limit: 200 });
      return normalizeList(data);
    },
  });

  const roomsQ = useQuery({
    queryKey: ["module5", "rooms", "summary"],
    queryFn: async () => {
      const { data } = await apiClient.rooms.list({ limit: 100 });
      return normalizeList(data);
    },
  });

  const occupancyRate = useMemo(() => {
    const rooms = roomsQ.data?.items ?? [];
    if (!rooms.length) return null;
    const occupied = rooms.filter((r: any) => r.status === "occupied").length;
    return Math.round((occupied / rooms.length) * 100);
  }, [roomsQ.data]);

  const todayRevenue = useMemo(() => {
    const payments = paymentsQ.data?.items ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return payments
      .filter((p: any) => p.paymentStatus === "Paid" && new Date(p.createdAt) >= today)
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  }, [paymentsQ.data]);

  const pendingPayments = useMemo(() => {
    const payments = paymentsQ.data?.items ?? [];
    return payments.filter((p: any) => p.paymentStatus === "Pending").reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  }, [paymentsQ.data]);

  const vehicleCount = vehiclesQ.data?.items?.length ?? vehiclesQ.data?.total ?? 0;

  const widgets = [
    {
      title: "Occupancy Rate",
      value: roomsQ.isLoading ? null : occupancyRate !== null ? `${occupancyRate}%` : "—",
      subtitle: `${(roomsQ.data?.items ?? []).filter((r: any) => r.status === "occupied").length} of ${roomsQ.data?.items?.length ?? 0} rooms`,
      icon: BedDouble,
      color: "text-sky-600",
      bg: "bg-sky-50",
      loading: roomsQ.isLoading,
    },
    {
      title: "Today's Revenue",
      value: paymentsQ.isLoading ? null : `₹${todayRevenue.toLocaleString()}`,
      subtitle: "Payments collected today",
      icon: IndianRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      loading: paymentsQ.isLoading,
    },
    {
      title: "Parking Occupancy",
      value: vehiclesQ.isLoading ? null : String(vehicleCount),
      subtitle: "Vehicles currently registered",
      icon: Car,
      color: "text-violet-600",
      bg: "bg-violet-50",
      loading: vehiclesQ.isLoading,
    },
    {
      title: "Pending Payments",
      value: paymentsQ.isLoading ? null : `₹${pendingPayments.toLocaleString()}`,
      subtitle: "Awaiting settlement",
      icon: CreditCard,
      color: "text-amber-600",
      bg: "bg-amber-50",
      loading: paymentsQ.isLoading,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {widgets.map((w) => {
        const Icon = w.icon;
        return (
          <Card key={w.title} className={`border ${w.bg}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">{w.title}</CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 shadow-sm ${w.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {w.loading ? (
                <Skeleton className="h-7 w-24 mb-1" />
              ) : (
                <div className={`text-2xl font-semibold ${w.color}`}>{w.value ?? "—"}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">{w.subtitle}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
