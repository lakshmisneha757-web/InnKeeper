import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { normalizeListResponse, exportRowsToCsv } from "@/lib/module5";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleFormSchema, VehicleForm } from "@/lib/module5Schemas";
import { toast } from "sonner";

export default function VehiclesPage(){
  const [search,setSearch]=useState("");
  const [page,setPage]=useState(1);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey:["vehicles",page,search],
    queryFn: async ()=>{
      const { data } = await apiClient.vehicles.list({ page, limit: 20, q: search });
      return normalizeListResponse<any>(data);
    }
  });

  const create = useMutation({ mutationFn: (payload:any)=>apiClient.vehicles.create(payload), onSuccess: ()=>{qc.invalidateQueries({ queryKey: ["vehicles"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Vehicle added");}, onError: (err:any)=>{ const msg = err?.response?.data?.error ?? err?.message ?? "Failed"; toast.error(String(msg)); } });
  

  const update = useMutation({ mutationFn: ({ id, data }:any)=>apiClient.vehicles.update(id, data), onSuccess: ()=>{qc.invalidateQueries({ queryKey: ["vehicles"] }); toast.success("Vehicle updated");}, onError: (err:any)=>{ const msg = err?.response?.data?.error ?? err?.message ?? "Failed"; toast.error(String(msg)); } });

  const remove = useMutation({ mutationFn: (id:string)=>apiClient.vehicles.remove(id), onSuccess: ()=>{qc.invalidateQueries({ queryKey: ["vehicles"] }); toast.success("Vehicle removed");}, onError: (err:any)=>{ const msg = err?.response?.data?.error ?? err?.message ?? "Failed"; toast.error(String(msg)); } });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const form = useForm<VehicleForm>({ resolver: zodResolver(vehicleFormSchema), defaultValues: { make: "", model: "", licensePlate: "", state: "", parkingSlot: "" } });

  useEffect(()=>{
    if (!dialogOpen) { form.reset(); setEditing(null); }
  }, [dialogOpen]);

  const handleAdd = ()=>{ setEditing(null); form.reset(); setDialogOpen(true); };

  const handleExport = ()=>{
    const csv = exportRowsToCsv(q.data?.items ?? [], [
      { key: "id", label: "ID" },
      { key: "licensePlate", label: "Plate" },
      { key: "make", label: "Make" },
      { key: "parkingSlot", label: "Slot" },
    ]);
    const blob = new Blob([csv], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "vehicles.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Vehicle Registry</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Search vehicles" value={search} onChange={(e:any)=>setSearch(e.target.value)} />
            <Button onClick={handleAdd}>New</Button>
            <Button variant="outline" onClick={handleExport}>Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate</TableHead>
                  <TableHead>Make / Model</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Arrival</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data?.items ?? []).map((v:any)=> (
                  <TableRow key={v.id}>
                    <TableCell>{v.licensePlate}</TableCell>
                    <TableCell>{v.make} {v.model}</TableCell>
                    <TableCell>{v.parkingSlot ?? "—"}</TableCell>
                    <TableCell>{v.parkingStatus}</TableCell>
                    <TableCell>{v.arrivalTime ? new Date(v.arrivalTime).toLocaleString() : "—"}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" onClick={()=>{ setEditing(v); form.reset({ make: v.make, model: v.model, licensePlate: v.licensePlate, state: v.state, parkingSlot: v.parkingSlot ?? "" }); setDialogOpen(true); }}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={()=>{ if(!window.confirm("Delete vehicle?")) return; remove.mutate(v.id); }}>Delete</Button>
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
            <DialogTitle>{editing ? "Edit Vehicle" : "New Vehicle"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values)=>{
              if (editing) {
                update.mutate({ id: editing.id, data: values });
              } else {
                create.mutate(values);
              }
              setDialogOpen(false);
            })}>
              <div className="grid gap-2">
                <FormItem>
                  <FormLabel>Make</FormLabel>
                  <FormControl>
                    <Input {...form.register("make")} />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input {...form.register("model")} />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>License Plate</FormLabel>
                  <FormControl>
                    <Input {...form.register("licensePlate")} />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input {...form.register("state")} />
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
