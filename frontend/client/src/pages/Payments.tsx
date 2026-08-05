import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { normalizeListResponse, exportRowsToCsv } from "@/lib/module5";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentFormSchema, PaymentForm } from "@/lib/module5Schemas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const paymentsQ = useQuery({
    queryKey: ["payments", page, search],
    queryFn: async () => {
      const { data } = await apiClient.payments.list({ page, limit: 20, q: search });
      return normalizeListResponse<any>(data);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiClient.payments.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment saved to PostgreSQL");
    },
    onError: () => toast.error("Failed to create payment"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiClient.payments.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment updated");
    },
    onError: (err:any) => {
      const msg = err?.response?.data?.error ?? err?.message ?? "Failed to update payment";
      toast.error(String(msg));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.payments.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Payment deleted"); },
    onError: () => toast.error("Failed to delete payment"),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const form = useForm<PaymentForm>({ resolver: zodResolver(paymentFormSchema) as any, defaultValues: { reservationId: "", amount: 0, method: "Credit Card", paymentStatus: "Pending", notes: "" } });

  useEffect(()=>{ if (!dialogOpen) { form.reset(); setEditing(null); } }, [dialogOpen]);

  const handleCreate = ()=>{ setEditing(null); form.reset(); setDialogOpen(true); };

  const handleExport = () => {
    const csv = exportRowsToCsv(paymentsQ.data?.items ?? [], [
      { key: "id", label: "Payment ID" },
      { key: "reservationId", label: "Reservation" },
      { key: "guest", label: "Guest" },
      { key: "roomId", label: "Room ID" },
      { key: "amount", label: "Amount" },
      { key: "method", label: "Payment Method" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Recorded Date" },
    ]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "payments.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Payments</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Search payments" value={search} onChange={(e:any)=>setSearch(e.target.value)} />
            <Button onClick={handleCreate}>New</Button>
            <Button variant="outline" onClick={handleExport}>Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Reservation</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recorded Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(paymentsQ.data?.items ?? []).map((p:any)=> (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.reservationId ?? "—"}</TableCell>
                    <TableCell>{p.guest ?? p.guestId ?? "—"}</TableCell>
                    <TableCell>{p.roomId ?? "—"}</TableCell>
                    <TableCell>₹{p.amount}</TableCell>
                    <TableCell>{p.method ?? "—"}</TableCell>
                    <TableCell>{p.status ?? p.paymentStatus ?? "—"}</TableCell>
                    <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" onClick={()=>{ setEditing(p); form.reset({ reservationId: p.reservationId ?? "", amount: p.amount ?? 0, method: p.method ?? "Credit Card", paymentStatus: p.status ?? p.paymentStatus ?? "Pending", notes: p.notes ?? "" }); setDialogOpen(true); }}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={()=>{ if(!window.confirm("Delete payment?")) return; deleteMutation.mutate(p.id); }}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Payment" : "New Payment"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values)=>{
              const payload = {
                reservationId: values.reservationId,
                amount: values.amount,
                method: values.method,
                status: values.paymentStatus,
                notes: values.notes,
              };
              if (editing) updateMutation.mutate({ id: editing.id, data: payload }); else createMutation.mutate(payload);
              setDialogOpen(false);
            })}>
              <div className="grid gap-2">
                <FormItem>
                  <FormLabel>Reservation ID</FormLabel>
                  <FormControl>
                    <Input {...form.register("reservationId")} />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" {...form.register("amount", { valueAsNumber: true })} />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <Select value={form.watch("method") ?? "Credit Card"} onValueChange={(value) => form.setValue("method", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Cash",
                          "Credit Card",
                          "Debit Card",
                          "UPI",
                          "Wallet",
                          "Bank Transfer",
                        ].map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={form.watch("paymentStatus") ?? "Pending"} onValueChange={(value) => form.setValue("paymentStatus", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Pending",
                          "Paid",
                          "Failed",
                          "Refunded",
                        ].map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={()=>setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Save</Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
