import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { normalizeListResponse, exportRowsToCsv } from "@/lib/module5";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ledgerFormSchema, LedgerForm } from "@/lib/module5Schemas";

export default function CashLedgerPage(){
  const [search,setSearch]=useState("");
  const qc = useQueryClient();

  const q = useQuery({ queryKey:["cash-ledger",search], queryFn: async ()=>{ const { data } = await apiClient.cashLedger.list({ limit: 50, q: search }); return normalizeListResponse<any>(data); } });

  const openShift = useMutation({ mutationFn: (payload:any)=>apiClient.cashLedger.create(payload), onSuccess: ()=>{qc.invalidateQueries({ queryKey: ["cash-ledger"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Shift opened");}, onError: (err:any)=>{ const msg = err?.response?.data?.error ?? err?.message ?? "Failed"; toast.error(String(msg)); } });


  const updateShift = useMutation({ mutationFn: ({ id, data }:any) => apiClient.cashLedger.update(id, data), onSuccess: ()=>{qc.invalidateQueries({ queryKey: ["cash-ledger"] }); toast.success("Shift updated");}, onError: (err:any)=>{ const msg = err?.response?.data?.error ?? err?.message ?? "Failed"; toast.error(String(msg)); } });

  const deleteShift = useMutation({ mutationFn: (id:string)=>apiClient.cashLedger.remove(id), onSuccess: ()=>{qc.invalidateQueries({ queryKey: ["cash-ledger"] }); toast.success("Shift removed");}, onError: (err:any)=>{ const msg = err?.response?.data?.error ?? err?.message ?? "Failed"; toast.error(String(msg)); } });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const form = useForm<LedgerForm>({ resolver: zodResolver(ledgerFormSchema) as any, defaultValues: { employeeName: "", openingCash: 0, closingCash: 0, status: "open", notes: "" } });

  useEffect(()=>{ if(!dialogOpen){ form.reset(); setEditing(null); } }, [dialogOpen]);

  const handleOpen = ()=>{ setEditing(null); form.reset(); setDialogOpen(true); };

  const handleExport = ()=>{
    const csv = exportRowsToCsv(q.data?.items ?? [], [
      { key: "id", label: "ID" },
      { key: "employeeName", label: "Employee" },
      { key: "openingCash", label: "Opening" },
      { key: "closingCash", label: "Closing" },
    ]);
    const blob = new Blob([csv], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "cash-ledger.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Cash Ledger</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Search ledger" value={search} onChange={(e:any)=>setSearch(e.target.value)} />
            <Button onClick={handleOpen}>Open Shift</Button>
            <Button variant="outline" onClick={handleExport}>Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Opening</TableHead>
                  <TableHead>Closing</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data?.items ?? []).map((r:any)=> (
                  <TableRow key={r.id}>
                    <TableCell>{r.employeeName}</TableCell>
                    <TableCell>{r.openingCash}</TableCell>
                    <TableCell>{r.closingCash}</TableCell>
                    <TableCell>{r.expectedCash}</TableCell>
                    <TableCell>{r.actualCash}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" onClick={()=>{ setEditing(r); form.reset({ employeeName: r.employeeName, openingCash: r.openingCash ?? 0, closingCash: r.closingCash ?? 0, status: r.status ?? "open", notes: r.notes ?? "" }); setDialogOpen(true); }}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={()=>{ if(!window.confirm("Delete ledger entry?")) return; deleteShift.mutate(r.id); }}>Delete</Button>
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
            <DialogTitle>{editing ? "Edit Shift" : "Open Shift"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values)=>{
              if (editing) {
                updateShift.mutate({ id: editing.id, data: values });
              } else {
                openShift.mutate(values);
              }
              setDialogOpen(false);
            })}>
              <div className="grid gap-2">
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <FormControl>
                    <Input {...form.register("employeeName")} />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Opening Cash</FormLabel>
                  <FormControl>
                    <Input type="number" {...form.register("openingCash", { valueAsNumber: true })} />
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
