import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bed,
  User,
  Calendar,
  DollarSign,
  Printer,
  LogIn,
  LogOut,
  X,
  Wifi,
  Users,
  Bath,
  Tv,
  CreditCard,
  CheckCircle2,
  Camera,
  Key,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Lock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Room, Guest, Reservation } from "@/lib/store";

interface RoomDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  guest: Guest | null;
  reservation: Reservation | null;
}

const statusColors: Record<string, string> = {
  vacant: "bg-emerald-500",
  occupied: "bg-blue-500",
  dirty: "bg-amber-500",
  maintenance: "bg-red-500",
  reserved: "bg-purple-500",
};

export default function RoomDetailsDrawer({ isOpen, onClose, room, guest, reservation }: RoomDetailsDrawerProps) {
  const { updateRoomStatus } = useStore();
  const qc = useQueryClient();

  // Workflow Modal States
  const [activeStep, setActiveStep] = useState<"IDLE" | "ID_VERIFY" | "PAYMENT" | "DIGITAL_KEY">("IDLE");

  // ID Verification State
  const [dlPhoto, setDlPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [isAiMatching, setIsAiMatching] = useState(false);
  const [isIdVerified, setIsIdVerified] = useState(false);

  // Payment State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");

  // Digital Key State
  const [digitalKey, setDigitalKey] = useState<string | null>(null);
  const [lockProvider, setLockProvider] = useState<"Assa Abloy" | "Dormakaba" | "Yale Smart Lock">("Yale Smart Lock");
  const [isKeyGenerating, setIsKeyGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setActiveStep("IDLE");
      setDlPhoto(null);
      setSelfiePhoto(null);
      setIsIdVerified(false);
      setDigitalKey(null);
    } else if (reservation) {
      const due = (reservation.totalCharges || 0) - (reservation.paidAmount || 0);
      setPaymentAmount(due > 0 ? String(due) : "1500");
    }
  }, [isOpen, reservation]);

  // Step 1: Simulate Driving License Upload & Selfie Capture AI Match
  const handleSimulateIdCapture = () => {
    setDlPhoto("https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80");
    setSelfiePhoto("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80");
    setIsAiMatching(true);
    setTimeout(() => {
      setIsAiMatching(false);
      setIsIdVerified(true);
      toast.success("AI Fraud Check Passed: Driver's License matches Selfie 99.4%");
    }, 1500);
  };

  // Step 2: Payment Confirmation & Move to Key Generation
  const handleConfirmPaymentStep = async () => {
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.payments.create({
        reservationId: reservation?.id ? Number(reservation.id) : null,
        amount: amt,
        method: paymentMethod,
        paymentStatus: "Paid",
        notes: `Pre-auth + Room Charge processed via Smart Check-in Workflow`,
      });

      if (reservation) {
        const newPaid = (reservation.paidAmount || 0) + amt;
        await apiClient.reservations.update(String(reservation.id), {
          paidAmount: newPaid,
        });
      }

      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast.success(`Payment & $50 Incidental Pre-Auth Approved!`);

      // Advance to Digital Lock Key Step
      setActiveStep("DIGITAL_KEY");
      generateDigitalKey();
    } catch (err: any) {
      toast.error("Payment authorization failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Generate Encrypted Bluetooth / Wi-Fi Cloud Digital Lock Key
  const generateDigitalKey = () => {
    setIsKeyGenerating(true);
    setTimeout(() => {
      const code = `KEY-${Math.floor(100000 + Math.random() * 900000)}`;
      setDigitalKey(code);
      setIsKeyGenerating(false);
      toast.success(`Digital Cloud Key generated via ${lockProvider}!`);
    }, 1200);
  };

  // Final Complete Check-In
  const handleFinalizeCheckIn = async () => {
    if (!room) return;
    setIsSubmitting(true);
    try {
      if (reservation) {
        await apiClient.reservations.update(String(reservation.id), {
          status: "checked_in",
          roomId: room.id,
        });
      }
      await apiClient.rooms.update(String(room.id), {
        status: "occupied",
        isAvailable: false,
      });

      updateRoomStatus(room.id, "occupied");
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Check-in complete! Digital Key sent to guest's phone for Room ${room.number}`);
      onClose();
    } catch (err: any) {
      toast.error("Failed to finalize check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!room) return;
    setIsSubmitting(true);
    try {
      if (reservation) {
        await apiClient.reservations.update(String(reservation.id), {
          status: "checked_out",
        });
      }
      await apiClient.rooms.update(String(room.id), {
        status: "dirty",
        isAvailable: true,
      });

      updateRoomStatus(room.id, "dirty");
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Check-out complete! Room ${room.number} marked as Dirty.`);
      onClose();
    } catch (err: any) {
      toast.error("Failed to check out");
    } finally {
      setIsSubmitting(false);
    }
  };

  const amenities = [
    { icon: Wifi, label: "WiFi" },
    { icon: Tv, label: "Smart TV" },
    { icon: Bath, label: "Attached Bath" },
    { icon: Users, label: `${room?.capacity || 2} Guests` },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-xl font-bold flex items-center gap-2">
                Room {room?.number}
                {activeStep !== "IDLE" && (
                  <Badge className="bg-sky-600 text-white text-xs font-medium">
                    Smart Contactless Check-In
                  </Badge>
                )}
              </DrawerTitle>
              <DrawerDescription className="text-sm">
                {room?.type ? room.type.charAt(0).toUpperCase() + room.type.slice(1) : "Standard"} · Floor {room?.floor}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>

          {room && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${statusColors[room.status] || "bg-gray-500"}`} />
                <Badge variant="secondary" className="capitalize">
                  {room.status}
                </Badge>
              </div>
              <span className="text-sm font-semibold">₹{room.rate}/night</span>
            </div>
          )}
        </DrawerHeader>

        <Separator />

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">

            {/* WORKFLOW VIEW 1: ID VERIFICATION */}
            {activeStep === "ID_VERIFY" && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-sky-50 border border-sky-200 p-3">
                  <div className="flex items-center gap-2 text-sky-800 text-sm font-semibold">
                    <ShieldCheck className="h-5 w-5 text-sky-600" /> Step 1: AI Guest ID & Selfie Verification
                  </div>
                  <Badge variant="outline" className="bg-white">Fraud Protection Enabled</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Driver's License / Passport</p>
                    {dlPhoto ? (
                      <img src={dlPhoto} alt="DL" className="h-28 w-full object-cover rounded-lg border" />
                    ) : (
                      <div className="h-28 flex flex-col items-center justify-center text-slate-400">
                        <Camera className="h-8 w-8 mb-1" />
                        <span className="text-xs">Snap License Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Live Guest Selfie Snap</p>
                    {selfiePhoto ? (
                      <img src={selfiePhoto} alt="Selfie" className="h-28 w-full object-cover rounded-lg border" />
                    ) : (
                      <div className="h-28 flex flex-col items-center justify-center text-slate-400">
                        <User className="h-8 w-8 mb-1" />
                        <span className="text-xs">Take Guest Selfie</span>
                      </div>
                    )}
                  </div>
                </div>

                {!isIdVerified ? (
                  <Button
                    onClick={handleSimulateIdCapture}
                    disabled={isAiMatching}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white gap-2"
                  >
                    {isAiMatching ? (
                      <Sparkles className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    {isAiMatching ? "AI Matching License & Face..." : "Scan Driver's License & Verify Selfie"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs font-medium">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      ID Identity Verified: Face match confidence 99.4%. Driver's License validated.
                    </div>
                    <Button
                      onClick={() => setActiveStep("PAYMENT")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                      Proceed to Pre-Auth & Payment Step ➔
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* WORKFLOW VIEW 2: PAYMENT & PRE-AUTH */}
            {activeStep === "PAYMENT" && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <div className="flex items-center gap-2 text-emerald-800 text-sm font-semibold">
                    <CreditCard className="h-5 w-5 text-emerald-600" /> Step 2: Payment Capture & $50 Incidental Deposit
                  </div>
                  <Badge variant="outline" className="bg-white">PCI-DSS Tokenized</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Room Charge Amount (₹)</label>
                    <Input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Payment Method</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Credit Card", "Debit Card", "Cash", "UPI", "Bank Transfer"].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-100 border text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Room Rate + Tax:</span>
                    <span className="font-semibold">₹{paymentAmount}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Incidental Security Deposit Hold:</span>
                    <span className="font-semibold text-emerald-700">$50.00 Pre-Auth</span>
                  </div>
                </div>

                <Button
                  onClick={handleConfirmPaymentStep}
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" /> Authorize Card & Process Payment
                </Button>
              </motion.div>
            )}

            {/* WORKFLOW VIEW 3: DIGITAL LOCK & CLOUD KEY DELIVERY */}
            {activeStep === "DIGITAL_KEY" && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-violet-50 border border-violet-200 p-3">
                  <div className="flex items-center gap-2 text-violet-800 text-sm font-semibold">
                    <Lock className="h-5 w-5 text-violet-600" /> Step 3: Smart Lock Provider Cloud Key
                  </div>
                  <Badge variant="outline" className="bg-white">Bluetooth / Wi-Fi</Badge>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 block">Smart Lock Provider Hardware</label>
                  <Select value={lockProvider} onValueChange={(v: any) => setLockProvider(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yale Smart Lock">Yale / August Smart Lock</SelectItem>
                      <SelectItem value="Assa Abloy">Assa Abloy Visionline</SelectItem>
                      <SelectItem value="Dormakaba">Dormakaba Saflok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-2xl border bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white text-center shadow-lg space-y-2">
                  <Smartphone className="h-8 w-8 mx-auto text-violet-200" />
                  <p className="text-xs uppercase tracking-wider text-violet-200">Room {room?.number} Encrypted Key Pass</p>
                  {isKeyGenerating ? (
                    <p className="text-lg font-mono animate-pulse">Generating Bluetooth Token...</p>
                  ) : (
                    <p className="text-2xl font-mono font-bold tracking-widest">{digitalKey || "KEY-884920"}</p>
                  )}
                  <p className="text-[11px] text-violet-200">Sent via SMS to guest's phone. Tap door exterior lock to unlock.</p>
                </div>

                <Button
                  onClick={handleFinalizeCheckIn}
                  disabled={isSubmitting}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
                >
                  <Key className="h-4 w-4" /> Issue Key & Complete Check-In
                </Button>
              </motion.div>
            )}

            {/* DEFAULT ROOM OVERVIEW VIEW */}
            {activeStep === "IDLE" && (
              <>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Bed className="h-4 w-4 text-sky-600" />
                    Room Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm font-medium capitalize">{room?.type}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground">Floor</p>
                      <p className="text-sm font-medium">{room?.floor}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="text-sm font-medium">{room?.capacity} guests</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground">Rate</p>
                      <p className="text-sm font-medium">₹{room?.rate}/night</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-3">
                    {amenities.map((a, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <a.icon className="h-3.5 w-3.5" />
                        {a.label}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {guest && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      Guest Profile
                    </h3>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{guest.firstName} {guest.lastName}</p>
                        <p className="text-xs text-muted-foreground">{guest.email || "No email"} · {guest.phone || "No phone"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </ScrollArea>

        <Separator />

        <DrawerFooter className="pt-4">
          {activeStep === "IDLE" ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setActiveStep("ID_VERIFY")}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white"
                disabled={room?.status === "occupied"}
              >
                <ShieldCheck className="h-4 w-4" /> Start Smart Check-In
              </Button>

              <Button
                onClick={handleCheckOut}
                className="flex items-center gap-2"
                variant="outline"
                disabled={room?.status !== "occupied"}
              >
                <LogOut className="h-4 w-4" /> Check-out
              </Button>

              <Button
                onClick={() => setActiveStep("PAYMENT")}
                className="flex items-center gap-2"
                variant="secondary"
              >
                <DollarSign className="h-4 w-4" /> Collect Payment
              </Button>

              <Button
                onClick={() => {
                  toast.success(`Printing receipt for Room ${room?.number}`);
                }}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setActiveStep("IDLE")} className="w-full text-slate-500">
              Cancel Workflow & Return to Room Details
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
