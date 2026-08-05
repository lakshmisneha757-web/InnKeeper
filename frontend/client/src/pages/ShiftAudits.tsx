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
import { shiftAuditFormSchema, ShiftAuditForm } from "@/lib/module5Schemas";

export default function ShiftAuditsPage(){
  const [search,setSearch]=useState("");
  const qc = useQueryClient();
  const q = useQuery({ queryKey:["shift-audits",search], queryFn: async ()=>{ const { data } = await apiClient.shiftAudits.list({ limit: 50, q: search }); return normalizeListResponse<any>(data); } });

  const create = useMutation({ mutationFn: (payload:any)=>apiClient.shiftAudits.create(payload), onSuccess: ()=>{qc.invalidateQueries({ queryKey: ["shift-audits"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Audit created");}, onError: (err:any)=>{ const msg = err?.response?.data?.error ?? err?.message ?? "Failed"; toast.error(String(msg)); } });
  

  const update = useMutation({ mutationFn: ({ id, data }:any)=>apiClient.shiftAudits.update(id, data), onSuccess: ()=>{qc.invalidateQueries({ queryKey: ["shift-audits"] }); toast.success("Audit updated");}, onError: (err:any)=>{ const msg = err?.response?.data?.error ?? err?.message ?? "Failed"; toast.error(String(msg)); } });

  const remove = useMutation({ mutationFn: (id:string)=>apiClient.shiftAudits.remove(id), onSuccess: ()=>{qc.invalidateQueries({ queryKey: ["shift-audits"] }); toast.success("Audit removed");}, onError: (err:any)=>{ const msg = err?.response?.data?.error ?? err?.message ?? "Failed"; toast.error(String(msg)); } });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const form = useForm<ShiftAuditForm>({ resolver: zodResolver(shiftAuditFormSchema) as any, defaultValues: { employeeName: "", openingCash: 0, closingCash: 0, status: "open", notes: "" } });
  useEffect(()=>{ if(!dialogOpen){ form.reset(); setEditing(null); } }, [dialogOpen]);
  const handleCreate = ()=>{ setEditing(null); form.reset(); setDialogOpen(true); };

  const handleExport = ()=>{
    const csv = exportRowsToCsv(q.data?.items ?? [], [ { key: "id", label: "ID" }, { key: "employeeName", label: "Employee" }, { key: "openingCash", label: "Opening" }, { key: "closingCash", label: "Closing" } ]);
    const blob = new Blob([csv], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "shift-audits.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Shift Audits</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Search audits" value={search} onChange={(e:any)=>setSearch(e.target.value)} />
            <Button onClick={handleCreate}>New</Button>
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
                  <TableHead>Difference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data?.items ?? []).map((r:any)=> (
                  <TableRow key={r.id}>
                    <TableCell>{r.employeeName}</TableCell>
                    <TableCell>{r.openingCash}</TableCell>
                    <TableCell>{r.closingCash}</TableCell>
                    <TableCell>{r.difference}</TableCell>
                    <TableCell>{r.status}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" onClick={()=>{ setEditing(r); form.reset({ employeeName: r.employeeName, openingCash: r.openingCash ?? 0, closingCash: r.closingCash ?? 0, status: r.status ?? "open", notes: r.notes ?? "" }); setDialogOpen(true); }}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={()=>{ if(!window.confirm("Delete audit?")) return; remove.mutate(r.id); }}>Delete</Button>
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
            <DialogTitle>{editing ? "Edit Audit" : "New Audit"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values)=>{
              if (editing) update.mutate({ id: editing.id, data: values }); else create.mutate(values);
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
