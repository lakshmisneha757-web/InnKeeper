import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CalendarDays, Plus, Search, LogIn, LogOut, Trash2, Edit } from "lucide-react";

function normalizeList(data: any) {
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (data?.items) return data;
  return { items: [], total: 0 };
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  checked_in: "bg-green-100 text-green-700",
  checked_out: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-amber-100 text-amber-700",
};

export default function ReservationsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const qc = useQueryClient();

  const reservationsQ = useQuery({
    queryKey: ["reservations", page, search],
    queryFn: async () => {
      const { data } = await apiClient.reservations.list({ page, limit: 20, q: search });
      return normalizeList(data);
    },
  });

  const roomsQ = useQuery({
    queryKey: ["rooms-list"],
    queryFn: async () => {
      const { data } = await apiClient.rooms.list({ limit: 100 });
      return normalizeList(data).items;
    },
  });

  const guestsQ = useQuery({
    queryKey: ["guests-list"],
    queryFn: async () => {
      const { data } = await apiClient.guests.list({ limit: 100 });
      return normalizeList(data).items;
    },
  });

  const form = useForm({
    defaultValues: {
      guestId: "",
      roomId: "",
      checkIn: "",
      checkOut: "",
      status: "confirmed",
      totalCharges: 0,
      paidAmount: 0,
      source: "Direct",
      notes: "",
    },
  });

  useEffect(() => {
    if (!dialogOpen) { form.reset(); setEditing(null); }
  }, [dialogOpen]);

  const createM = useMutation({
    mutationFn: (d: any) => apiClient.reservations.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reservations"] }); toast.success("Reservation created"); setDialogOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to create reservation"),
  });

  const updateM = useMutation({
    mutationFn: ({ id, data }: any) => apiClient.reservations.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reservations"] }); toast.success("Reservation updated"); setDialogOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to update reservation"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => apiClient.reservations.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reservations"] }); toast.success("Reservation deleted"); },
    onError: () => toast.error("Failed to delete reservation"),
  });

  const quickStatusM = useMutation({
    mutationFn: ({ id, status }: any) => apiClient.reservations.update(id, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast.success(vars.status === "checked_in" ? "Guest checked in!" : "Guest checked out!");
    },
  });

  const handleSubmit = (values: any) => {
    const payload = {
      ...values,
      guestId: values.guestId ? Number(values.guestId) : null,
      roomId: values.roomId ? Number(values.roomId) : null,
      totalCharges: Number(values.totalCharges) || 0,
      paidAmount: Number(values.paidAmount) || 0,
    };
    if (editing) updateM.mutate({ id: editing.id, data: payload });
    else createM.mutate(payload);
  };

  const items = reservationsQ.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reservations</h1>
          <p className="text-sm text-muted-foreground">Manage all hotel reservations</p>
        </div>
        <Button onClick={() => { setEditing(null); form.reset(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Reservation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search guest name, status..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Charges</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservationsQ.isLoading ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No reservations found</TableCell></TableRow>
                ) : items.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-medium">
                      {r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : "—"}
                    </TableCell>
                    <TableCell>{r.roomId ? `Room ${r.roomId}` : "—"}</TableCell>
                    <TableCell>{r.checkIn ? new Date(r.checkIn).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>{r.checkOut ? new Date(r.checkOut).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.status?.replace("_", " ") ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>₹{(r.totalCharges ?? 0).toLocaleString()}</TableCell>
                    <TableCell>₹{(r.paidAmount ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.source ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {r.status === "confirmed" && (
                          <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs text-green-700"
                            onClick={() => quickStatusM.mutate({ id: r.id, status: "checked_in" })}>
                            <LogIn className="h-3 w-3" /> In
                          </Button>
                        )}
                        {r.status === "checked_in" && (
                          <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs text-blue-700"
                            onClick={() => quickStatusM.mutate({ id: r.id, status: "checked_out" })}>
                            <LogOut className="h-3 w-3" /> Out
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditing(r);
                            form.reset({
                              guestId: r.guestId ? String(r.guestId) : "",
                              roomId: r.roomId ? String(r.roomId) : "",
                              checkIn: r.checkIn ? new Date(r.checkIn).toISOString().split("T")[0] : "",
                              checkOut: r.checkOut ? new Date(r.checkOut).toISOString().split("T")[0] : "",
                              status: r.status ?? "confirmed",
                              totalCharges: r.totalCharges ?? 0,
                              paidAmount: r.paidAmount ?? 0,
                              source: r.source ?? "Direct",
                              notes: r.notes ?? "",
                            });
                            setDialogOpen(true);
                          }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                          onClick={() => { if (!window.confirm("Delete reservation?")) return; deleteM.mutate(r.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>{reservationsQ.data?.total ?? 0} total reservations</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={items.length < 20}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-2xl p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">{editing ? "Edit Reservation" : "New Reservation"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <FormItem>
                  <FormLabel>Guest</FormLabel>
                  <FormControl>
                    <Select value={form.watch("guestId")} onValueChange={v => form.setValue("guestId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select guest" /></SelectTrigger>
                      <SelectContent>
                        {(guestsQ.data ?? []).map((g: any) => (
                          <SelectItem key={g.id} value={String(g.id)}>{g.firstName} {g.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <FormControl>
                    <Select value={form.watch("roomId")} onValueChange={v => form.setValue("roomId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                      <SelectContent>
                        {(roomsQ.data ?? []).map((r: any) => (
                          <SelectItem key={r.id} value={String(r.id)}>Room {r.number} ({r.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormItem>
                  <FormLabel>Check In</FormLabel>
                  <FormControl><Input type="date" {...form.register("checkIn")} /></FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Check Out</FormLabel>
                  <FormControl><Input type="date" {...form.register("checkOut")} /></FormControl>
                </FormItem>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={form.watch("status")} onValueChange={v => form.setValue("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["confirmed", "checked_in", "checked_out", "cancelled", "no_show"].map(s => (
                          <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Select value={form.watch("source")} onValueChange={v => form.setValue("source", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Direct", "Booking.com", "Expedia", "Airbnb", "MakeMyTrip"].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormItem>
                  <FormLabel>Total Charges (₹)</FormLabel>
                  <FormControl><Input type="number" {...form.register("totalCharges", { valueAsNumber: true })} /></FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Paid Amount (₹)</FormLabel>
                  <FormControl><Input type="number" {...form.register("paidAmount", { valueAsNumber: true })} /></FormControl>
                </FormItem>
              </div>
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Input {...form.register("notes")} placeholder="Special requests..." /></FormControl>
              </FormItem>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createM.isPending || updateM.isPending}>
                  {createM.isPending || updateM.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
