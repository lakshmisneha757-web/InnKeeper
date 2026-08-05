import { useState, useEffect } from "react";
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
import { Plus, Search, Edit, Trash2, Star } from "lucide-react";

function normalizeList(data: any) {
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (data?.items) return data;
  return { items: [], total: 0 };
}

export default function GuestsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const qc = useQueryClient();

  const guestsQ = useQuery({
    queryKey: ["guests", page, search],
    queryFn: async () => {
      const { data } = await apiClient.guests.list({ page, limit: 20, q: search });
      return normalizeList(data);
    },
  });

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      idType: "Aadhar",
      idNumber: "",
      specialRequests: "",
    },
  });

  useEffect(() => {
    if (!dialogOpen) { form.reset(); setEditing(null); }
  }, [dialogOpen]);

  const createM = useMutation({
    mutationFn: (d: any) => apiClient.guests.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["guests"] }); toast.success("Guest profile created"); setDialogOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to create guest"),
  });

  const updateM = useMutation({
    mutationFn: ({ id, data }: any) => apiClient.guests.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["guests"] }); toast.success("Guest profile updated"); setDialogOpen(false); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to update guest"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => apiClient.guests.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["guests"] }); toast.success("Guest deleted"); },
    onError: () => toast.error("Failed to delete guest"),
  });

  const handleSubmit = (values: any) => {
    if (editing) updateM.mutate({ id: editing.id, data: values });
    else createM.mutate(values);
  };

  const items = guestsQ.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Guests</h1>
          <p className="text-sm text-muted-foreground">Manage guest profiles and history</p>
        </div>
        <Button onClick={() => { setEditing(null); form.reset(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Guest
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, phone..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>ID Type</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Loyalty</TableHead>
                  <TableHead>Since</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guestsQ.isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No guests found</TableCell></TableRow>
                ) : items.map((g: any) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.firstName} {g.lastName}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        g.reservations?.some((r: any) => r.status === 'CHECKED_IN' || r.status === 'checked_in')
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>
                        {g.reservations?.some((r: any) => r.status === 'CHECKED_IN' || r.status === 'checked_in') ? "Checked-In" : "Registered"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{g.email ?? "—"}</TableCell>
                    <TableCell>{g.phone ?? "—"}</TableCell>
                    <TableCell className="text-sm">{g.idType ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{g.idNumber ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-sm">{g.loyaltyPoints ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditing(g);
                            form.reset({
                              firstName: g.firstName ?? "",
                              lastName: g.lastName ?? "",
                              email: g.email ?? "",
                              phone: g.phone ?? "",
                              idType: g.idType ?? "Aadhar",
                              idNumber: g.idNumber ?? "",
                              specialRequests: g.specialRequests ?? "",
                            });
                            setDialogOpen(true);
                          }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                          onClick={() => { if (!window.confirm("Delete guest?")) return; deleteM.mutate(g.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>{guestsQ.data?.total ?? 0} total guests</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={items.length < 20}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Guest" : "New Guest"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl><Input {...form.register("firstName")} required /></FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl><Input {...form.register("lastName")} required /></FormControl>
                </FormItem>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...form.register("email")} /></FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...form.register("phone")} /></FormControl>
                </FormItem>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormItem>
                  <FormLabel>ID Type</FormLabel>
                  <FormControl>
                    <Select value={form.watch("idType")} onValueChange={v => form.setValue("idType", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Aadhar", "Passport", "PAN", "Driving License", "Voter ID"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>ID Number</FormLabel>
                  <FormControl><Input {...form.register("idNumber")} /></FormControl>
                </FormItem>
              </div>
              <FormItem>
                <FormLabel>Special Requests</FormLabel>
                <FormControl><Input {...form.register("specialRequests")} placeholder="e.g. High floor, non-smoking..." /></FormControl>
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
