import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Sparkles, Plus, RefreshCw } from "lucide-react";

function normalizeList(data: any) {
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (data?.items) return data;
  return { items: [], total: 0 };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pending",     color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  "in-progress": { label: "In Progress", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  clean:       { label: "Clean",       color: "text-green-700", bg: "bg-green-50 border-green-200" },
  inspected:   { label: "Inspected",   color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
};

export default function HousekeepingPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const qc = useQueryClient();

  const hkQ = useQuery({
    queryKey: ["housekeeping", filterStatus],
    queryFn: async () => {
      const { data } = await apiClient.housekeeping.list({ limit: 100 });
      const list = normalizeList(data).items;
      return filterStatus === "all" ? list : list.filter((r: any) => r.status === filterStatus);
    },
  });

  const roomsQ = useQuery({
    queryKey: ["rooms-hk"],
    queryFn: async () => {
      const { data } = await apiClient.rooms.list({ limit: 100 });
      return normalizeList(data).items;
    },
  });

  const form = useForm({
    defaultValues: { roomId: "", status: "pending", assignedTo: "", notes: "" },
  });

  const createM = useMutation({
    mutationFn: (d: any) => apiClient.housekeeping.create({ ...d, roomId: Number(d.roomId) || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["housekeeping"] }); toast.success("Task created"); setDialogOpen(false); form.reset(); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed"),
  });

  const updateM = useMutation({
    mutationFn: ({ id, data }: any) => apiClient.housekeeping.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["housekeeping"] }); toast.success("Status updated"); },
    onError: () => toast.error("Failed to update"),
  });

  const statusOrder = ["pending", "in-progress", "clean", "inspected"];
  const nextStatus = (current: string) => {
    const idx = statusOrder.indexOf(current);
    return statusOrder[Math.min(idx + 1, statusOrder.length - 1)];
  };

  const items = hkQ.data ?? [];
  const counts = statusOrder.reduce((acc: any, s) => {
    acc[s] = (hkQ.data ?? []).filter((r: any) => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Housekeeping</h1>
          <p className="text-sm text-muted-foreground">Track room cleaning and inspection status</p>
        </div>
        <Button onClick={() => { form.reset(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusOrder.map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className={`rounded-xl border p-4 text-left transition-all ${filterStatus === s ? cfg.bg + " ring-2 ring-offset-1 ring-current " + cfg.color : "bg-card border-border hover:border-primary/30"}`}>
              <div className={`text-2xl font-bold ${filterStatus === s ? cfg.color : ""}`}>{counts[s] ?? 0}</div>
              <div className="text-sm text-muted-foreground mt-1">{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOrder.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["housekeeping"] })}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Room Cards Grid */}
      {hkQ.isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No housekeeping tasks</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((task: any) => {
            const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG["pending"];
            const roomLabel = task.roomId
              ? (roomsQ.data ?? []).find((r: any) => r.id === task.roomId)?.number
                ? `Room ${(roomsQ.data ?? []).find((r: any) => r.id === task.roomId)?.number}`
                : `Room #${task.roomId}`
              : "No Room";
            const next = nextStatus(task.status);
            const isLast = task.status === "inspected";
            return (
              <Card key={task.id} className={`border ${cfg.bg} transition-all`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{roomLabel}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{task.assignedTo ?? "Unassigned"}</div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {task.notes && <p className="text-xs text-muted-foreground mb-3 italic">"{task.notes}"</p>}
                  <div className="flex gap-2">
                    {!isLast && (
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                        onClick={() => updateM.mutate({ id: task.id, data: { status: next } })}>
                        Mark {STATUS_CONFIG[next]?.label}
                      </Button>
                    )}
                    {isLast && (
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                        onClick={() => updateM.mutate({ id: task.id, data: { status: "pending" } })}>
                        Reset
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Housekeeping Task</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => createM.mutate(d))} className="grid gap-3">
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
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <FormControl><Input {...form.register("assignedTo")} placeholder="Housekeeper name" /></FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select value={form.watch("status")} onValueChange={v => form.setValue("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOrder.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Input {...form.register("notes")} placeholder="Extra towels, deep clean..." /></FormControl>
              </FormItem>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createM.isPending}>Save</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
