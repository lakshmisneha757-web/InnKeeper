import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Wrench, Plus, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";

function normalizeList(data: any) {
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (data?.items) return data;
  return { items: [], total: 0 };
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  low:    { label: "Low",    color: "text-slate-500",  icon: Clock },
  normal: { label: "Normal", color: "text-blue-600",   icon: Wrench },
  high:   { label: "High",   color: "text-amber-600",  icon: AlertTriangle },
  urgent: { label: "Urgent", color: "text-red-600",    icon: Zap },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: "Open",        color: "text-red-700",    bg: "bg-red-50" },
  "in-progress": { label: "In Progress", color: "text-amber-700", bg: "bg-amber-50" },
  resolved:    { label: "Resolved",    color: "text-green-700",  bg: "bg-green-50" },
};

export default function MaintenancePage() {
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const qc = useQueryClient();

  const mainQ = useQuery({
    queryKey: ["maintenance", filterPriority, filterStatus],
    queryFn: async () => {
      const { data } = await apiClient.maintenance.list({ limit: 100 });
      let list = normalizeList(data).items;
      if (filterPriority !== "all") list = list.filter((r: any) => r.priority === filterPriority);
      if (filterStatus !== "all") list = list.filter((r: any) => r.status === filterStatus);
      return list;
    },
  });

  const roomsQ = useQuery({
    queryKey: ["rooms-maint"],
    queryFn: async () => {
      const { data } = await apiClient.rooms.list({ limit: 100 });
      return normalizeList(data).items;
    },
  });

  const form = useForm({
    defaultValues: { roomId: "", issue: "", priority: "normal", status: "open", notes: "" },
  });

  const createM = useMutation({
    mutationFn: (d: any) => apiClient.maintenance.create({ ...d, roomId: d.roomId ? Number(d.roomId) : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["maintenance"] }); toast.success("Issue reported"); setDialogOpen(false); form.reset(); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed"),
  });

  const updateM = useMutation({
    mutationFn: ({ id, data }: any) => apiClient.maintenance.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["maintenance"] }); toast.success("Issue updated"); },
    onError: () => toast.error("Failed to update"),
  });

  const items = mainQ.data ?? [];

  const openCount = items.filter((r: any) => r.status === "open").length;
  const urgentCount = items.filter((r: any) => r.priority === "urgent" && r.status !== "resolved").length;
  const inProgressCount = items.filter((r: any) => r.status === "in-progress").length;
  const resolvedCount = items.filter((r: any) => r.status === "resolved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance</h1>
          <p className="text-sm text-muted-foreground">Track and resolve facility issues</p>
        </div>
        <Button onClick={() => { form.reset(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Report Issue
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open Issues", value: openCount, color: "text-red-600", bg: "bg-red-50" },
          { label: "Urgent", value: urgentCount, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "In Progress", value: inProgressCount, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Resolved", value: resolvedCount, color: "text-green-600", bg: "bg-green-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl ${s.bg} border p-4`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mainQ.isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No issues found</TableCell></TableRow>
                ) : items.map((m: any) => {
                  const pc = PRIORITY_CONFIG[m.priority] ?? PRIORITY_CONFIG["normal"];
                  const sc = STATUS_CONFIG[m.status] ?? STATUS_CONFIG["open"];
                  const PIcon = pc.icon;
                  const roomLabel = m.roomId
                    ? (roomsQ.data ?? []).find((r: any) => r.id === m.roomId)?.number
                      ? `Room ${(roomsQ.data ?? []).find((r: any) => r.id === m.roomId)?.number}`
                      : `#${m.roomId}`
                    : "General";
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{roomLabel}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm font-medium">{m.issue}</p>
                          {m.notes && <p className="text-xs text-muted-foreground mt-0.5">{m.notes}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1.5 ${pc.color}`}>
                          <PIcon className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{pc.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.color}`}>
                          {sc.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {m.status === "open" && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                              onClick={() => updateM.mutate({ id: m.id, data: { status: "in-progress" } })}>
                              Start
                            </Button>
                          )}
                          {m.status === "in-progress" && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-green-700"
                              onClick={() => updateM.mutate({ id: m.id, data: { status: "resolved" } })}>
                              Resolve
                            </Button>
                          )}
                          {m.status === "resolved" && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                              onClick={() => updateM.mutate({ id: m.id, data: { status: "open" } })}>
                              Reopen
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Report Maintenance Issue</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => createM.mutate(d))} className="grid gap-3">
              <FormItem>
                <FormLabel>Room</FormLabel>
                <FormControl>
                  <Select value={form.watch("roomId")} onValueChange={v => form.setValue("roomId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select room (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General / No Room</SelectItem>
                      {(roomsQ.data ?? []).map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)}>Room {r.number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Issue Description</FormLabel>
                <FormControl><Input {...form.register("issue")} placeholder="Describe the issue..." required /></FormControl>
              </FormItem>
              <div className="grid grid-cols-2 gap-3">
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Select value={form.watch("priority")} onValueChange={v => form.setValue("priority", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={form.watch("status")} onValueChange={v => form.setValue("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              </div>
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl><Input {...form.register("notes")} placeholder="Any additional details..." /></FormControl>
              </FormItem>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createM.isPending}>Report</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
