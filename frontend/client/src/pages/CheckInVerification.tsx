import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Camera,
  KeyRound,
  FileBadge,
  CheckCircle2,
  QrCode,
  Lock,
  Unlock,
  Sparkles,
  RefreshCw,
  Search,
  User,
  Building2,
  Smartphone,
  CreditCard,
  BedDouble,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Sample Available Rooms List for Selection
const AVAILABLE_ROOMS = [
  { id: 101, type: "Deluxe King Suite", price: 189, floor: 1, capacity: 2, amenities: ["King Bed", "Ocean View", "Free WiFi", "Smart Lock"], image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop" },
  { id: 102, type: "Executive Double Room", price: 219, floor: 1, capacity: 4, amenities: ["2 Queen Beds", "Work Desk", "Mini Bar", "Keyless Entry"], image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&auto=format&fit=crop" },
  { id: 201, type: "Penthouse Skyline Suite", price: 349, floor: 2, capacity: 3, amenities: ["Balcony View", "Jacuzzi", "High-speed Fiber", "Express Check-In"], image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop" },
  { id: 202, type: "Standard Queen Room", price: 139, floor: 2, capacity: 2, amenities: ["Queen Bed", "Smart TV", "Air Conditioned"], image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&auto=format&fit=crop" }
];

export default function CheckInVerification() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedResId, setSelectedResId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Step flow: 1 = Room Selection & Payment Gateway, 2 = DL & Selfie Verification, 3 = Digital Key & Unlock Simulation
  const [step, setStep] = useState<number>(1);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);

  // Room Booking & Payment Form State
  const [selectedRoom, setSelectedRoom] = useState<any>(AVAILABLE_ROOMS[0]);
  const [bookingData, setBookingData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    paymentMethod: "Credit Card", // 'Credit Card' | 'Stripe' | 'PayPal' | 'UPI'
    cardNumber: "",
    cardHolder: "",
    expiry: "",
    cvv: "",
    upiId: "",
  });
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);

  // Form / Camera State for ID Verification
  const [dlImage, setDlImage] = useState<string>("");
  const [selfieImage, setSelfieImage] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Verification Results
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Lock Key & Door Simulation
  const [generatingKey, setGeneratingKey] = useState<boolean>(false);
  const [keyDetails, setKeyDetails] = useState<any>(null);
  const [doorStatus, setDoorStatus] = useState<"LOCKED" | "UNLOCKED">("LOCKED");
  const [unlocking, setUnlocking] = useState<boolean>(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await fetch("/api/reservations");
      if (res.ok) {
        const data = await res.json();
        setReservations(data.items || data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedReservation = reservations.find((r) => String(r.id) === String(selectedResId));

  // Handle Room Booking with Payment Gateway Details
  const handleCreateBookingWithPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.firstName || !bookingData.lastName) {
      toast.error("Please fill in Guest First & Last Name");
      return;
    }
    if (bookingData.paymentMethod === "Credit Card" && (!bookingData.cardNumber || !bookingData.cardHolder)) {
      toast.error("Please complete all Payment Card details");
      return;
    }

    setSubmittingBooking(true);
    try {
      const res = await fetch("/api/checkin/book-with-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingData,
          roomId: selectedRoom.id,
          totalAmount: selectedRoom.price * 2, // 2 nights calculation
        }),
      });

      const data = await res.json();
      setSubmittingBooking(false);

      if (res.ok && data.success) {
        toast.success("Room Booked & Payment Processed Successfully!");
        setIsBookingModalOpen(false);
        await fetchReservations();
        setSelectedResId(String(data.reservation.id));
        setStep(2); // Automatically advance to Driving License & Selfie verification step!
      } else {
        toast.error(data.error || "Booking & Payment failed.");
      }
    } catch (err) {
      setSubmittingBooking(false);
      toast.error("Network error processing payment");
    }
  };

  // Handle Camera Capture for Selfie
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Unable to access camera for selfie capture");
      setIsCameraActive(false);
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setSelfieImage(dataUrl);
      stopCamera();
      toast.success("Selfie captured successfully!");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "DL" | "SELFIE") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "DL") {
          setDlImage(reader.result as string);
          toast.success("Driving License photo uploaded");
        } else {
          setSelfieImage(reader.result as string);
          toast.success("Selfie photo uploaded");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Process ID Verification
  const handleVerifyId = async () => {
    if (!selectedResId) {
      toast.error("Please select a reservation first");
      return;
    }
    if (!dlImage) {
      toast.error("Please upload or capture Driving License photo");
      return;
    }
    if (!selfieImage) {
      toast.error("Please capture or upload Selfie photo");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/checkin/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: selectedResId,
          dlImageUrl: dlImage,
          selfieImageUrl: selfieImage,
        }),
      });

      const data = await res.json();
      setVerifying(false);

      if (res.ok && data.success) {
        setVerificationResult(data);
        toast.success(`ID Verification Passed! Match score: ${data.matchScore}`);
        setStep(3);
      } else {
        toast.error(data.error || "ID Verification failed");
      }
    } catch (err) {
      setVerifying(false);
      toast.error("Error connecting to verification service");
    }
  };

  // Issue Digital Lock Key & Complete Check-In
  const handleGenerateDigitalKey = async () => {
    if (!selectedResId) return;
    setGeneratingKey(true);
    try {
      const res = await fetch("/api/checkin/generate-lock-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: selectedResId }),
      });

      const data = await res.json();
      setGeneratingKey(false);

      if (res.ok && data.success) {
        setKeyDetails(data);
        toast.success("Check-In Complete! Digital Room Key & Access PIN generated.");
        fetchReservations();
      } else {
        toast.error(data.error || "Failed to generate digital room key");
      }
    } catch (err) {
      setGeneratingKey(false);
      toast.error("Error communicating with smart lock system");
    }
  };

  // Simulate Unlock Door
  const handleSimulateUnlock = async () => {
    if (!selectedResId || !keyDetails) return;
    setUnlocking(true);
    try {
      const res = await fetch("/api/checkin/unlock-door", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: selectedResId,
          digitalPin: keyDetails.digitalPin,
        }),
      });

      const data = await res.json();
      setUnlocking(false);

      if (res.ok && data.success) {
        setDoorStatus("UNLOCKED");
        toast.success(data.message);
        setTimeout(() => setDoorStatus("LOCKED"), 4000);
      } else {
        toast.error(data.message || "Door unlock failed");
      }
    } catch (err) {
      setUnlocking(false);
      toast.error("Smart lock response error");
    }
  };

  const filteredReservations = reservations.filter((r) => {
    const name = `${r.guest?.firstName || ""} ${r.guest?.lastName || ""}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || String(r.id).includes(searchQuery);
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Express Contactless Desk
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Room Booking & Check-In Portal</h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Book available rooms with instant payment gateway processing, driving license OCR & digital room key generation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsBookingModalOpen(true)}
              className="bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold shadow-lg text-xs py-5 px-5 gap-2"
            >
              <BedDouble className="w-4 h-4" /> Book New Room Now
            </Button>
          </div>
        </div>
      </div>

      {/* Workflow Stepper */}
      <div className="grid grid-cols-3 gap-4">
        <div
          onClick={() => setStep(1)}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            step === 1 ? "bg-card border-primary ring-2 ring-primary/20 shadow-md" : "bg-card/50 border-border opacity-70"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${step === 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Step 1</p>
              <p className="text-sm font-bold">Room & Payment</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => selectedResId && setStep(2)}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            step === 2 ? "bg-card border-primary ring-2 ring-primary/20 shadow-md" : "bg-card/50 border-border opacity-70"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <FileBadge className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Step 2</p>
              <p className="text-sm font-bold">DL & Selfie Verification</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => verificationResult && setStep(3)}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            step === 3 ? "bg-card border-primary ring-2 ring-primary/20 shadow-md" : "bg-card/50 border-border opacity-70"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${step === 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Step 3</p>
              <p className="text-sm font-bold">Digital Key Pass</p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Room Selection / New Booking Modal / Select Existing */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Available Rooms Grid */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-emerald-500" /> Select Room for Express Booking
                </h2>
                <p className="text-xs text-muted-foreground">Pick a room type to open instant checkout and payment details.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {AVAILABLE_ROOMS.map((room) => {
                const isCurrent = selectedRoom.id === room.id;
                return (
                  <div
                    key={room.id}
                    className={`rounded-2xl border overflow-hidden transition-all flex flex-col justify-between ${
                      isCurrent ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md" : "border-border hover:border-slate-400"
                    }`}
                  >
                    <div className="relative h-36">
                      <img src={room.image} alt={room.type} className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                        ${room.price}/night
                      </span>
                    </div>

                    <div className="p-4 space-y-2 flex-1">
                      <h3 className="font-bold text-sm">{room.type}</h3>
                      <p className="text-xs text-muted-foreground">Room #{room.id} • Floor {room.floor}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {room.amenities.map((am) => (
                          <span key={am} className="text-[10px] bg-accent px-2 py-0.5 rounded-md font-medium text-muted-foreground">
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <Button
                        onClick={() => {
                          setSelectedRoom(room);
                          setIsBookingModalOpen(true);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl gap-1.5"
                      >
                        Book & Pay (${room.price * 2}) <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Existing Bookings List */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold">Or Select Existing Booking for Check-In Verification</h2>
                <p className="text-xs text-muted-foreground">Select a previously confirmed reservation to complete ID verification.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search guest or reservation ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>

            {filteredReservations.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-xl">
                <User className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">No existing reservations found</p>
                <p className="text-xs text-muted-foreground">Click 'Book New Room Now' above to create a new reservation.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReservations.map((res) => {
                  const isSelected = String(res.id) === String(selectedResId);
                  const guestName = res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : `Guest #${res.guestId || res.id}`;

                  return (
                    <div
                      key={res.id}
                      onClick={() => {
                        setSelectedResId(String(res.id));
                        if (res.verificationStatus === "VERIFIED") {
                          setVerificationResult({ matchScore: "96%", verificationStatus: "VERIFIED" });
                        }
                      }}
                      className={`cursor-pointer rounded-xl border p-5 transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20"
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                            Res #{res.id}
                          </span>
                          <h3 className="font-bold text-base mt-1">{guestName}</h3>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            res.verificationStatus === "VERIFIED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {res.verificationStatus || "UNVERIFIED"}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3 mt-3">
                        <div className="flex justify-between">
                          <span>Room Assigned:</span>
                          <span className="font-semibold text-foreground">Room #{res.roomId || "101"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paid Amount:</span>
                          <span className="font-semibold text-emerald-500">${res.paidAmount || res.totalCharges || 299}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Digital Lock Status:</span>
                          <span className="font-semibold text-foreground">{res.digitalKeyStatus || "INACTIVE"}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStep(2);
                          }}
                          className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold gap-2"
                        >
                          Proceed to ID Verification <FileBadge className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ROOM BOOKING & PAYMENT GATEWAY MODAL */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-6 my-8 opacity-100 text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Book {selectedRoom.type}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Fill in guest details & complete secure payment gateway authorization.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBookingWithPayment} className="space-y-6">
              {/* Guest Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">1. Guest Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1 text-slate-800 dark:text-slate-200">First Name *</label>
                    <Input
                      required
                      placeholder="e.g. John"
                      value={bookingData.firstName}
                      onChange={(e) => setBookingData({ ...bookingData, firstName: e.target.value })}
                      className="rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1 text-slate-800 dark:text-slate-200">Last Name *</label>
                    <Input
                      required
                      placeholder="e.g. Doe"
                      value={bookingData.lastName}
                      onChange={(e) => setBookingData({ ...bookingData, lastName: e.target.value })}
                      className="rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1 text-slate-800 dark:text-slate-200">Email Address</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                      className="rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1 text-slate-800 dark:text-slate-200">Phone Number</label>
                    <Input
                      placeholder="+1 (555) 000-1234"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                      className="rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Dates */}
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">2. Dates & Stay Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1 text-slate-800 dark:text-slate-200">Check-In Date</label>
                    <Input
                      type="date"
                      value={bookingData.checkIn}
                      onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
                      className="rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1 text-slate-800 dark:text-slate-200">Check-Out Date</label>
                    <Input
                      type="date"
                      value={bookingData.checkOut}
                      onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                      className="rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Gateway Options */}
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">3. Payment Gateway Selection</h3>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">Total: ${selectedRoom.price * 2}</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {["Credit Card", "Stripe", "PayPal", "UPI"].map((pm) => (
                    <button
                      type="button"
                      key={pm}
                      onClick={() => setBookingData({ ...bookingData, paymentMethod: pm })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                        bookingData.paymentMethod === pm
                          ? "border-emerald-600 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30"
                          : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {pm}
                    </button>
                  ))}
                </div>

                {/* Credit Card / Gateway Fields */}
                {bookingData.paymentMethod === "Credit Card" || bookingData.paymentMethod === "Stripe" ? (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 mt-3">
                    <div>
                      <label className="text-xs font-semibold block mb-1 text-slate-800 dark:text-slate-200">Cardholder Name</label>
                      <Input
                        placeholder="John Doe"
                        value={bookingData.cardHolder}
                        onChange={(e) => setBookingData({ ...bookingData, cardHolder: e.target.value })}
                        className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1 text-slate-800 dark:text-slate-200">Card Number</label>
                      <Input
                        placeholder="4532 •••• •••• 8892"
                        value={bookingData.cardNumber}
                        onChange={(e) => setBookingData({ ...bookingData, cardNumber: e.target.value })}
                        className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold block mb-1 text-slate-800 dark:text-slate-200">Expiry (MM/YY)</label>
                        <Input
                          placeholder="12/28"
                          value={bookingData.expiry}
                          onChange={(e) => setBookingData({ ...bookingData, expiry: e.target.value })}
                          className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1 text-slate-800 dark:text-slate-200">CVV Security Code</label>
                        <Input
                          type="password"
                          maxLength={4}
                          placeholder="882"
                          value={bookingData.cvv}
                          onChange={(e) => setBookingData({ ...bookingData, cvv: e.target.value })}
                          className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 mt-3">
                    <label className="text-xs font-semibold block mb-1 text-slate-800 dark:text-slate-200">Virtual Payment Address / Account ID</label>
                    <Input
                      placeholder={bookingData.paymentMethod === "UPI" ? "user@upi" : "user@paypal.com"}
                      value={bookingData.upiId}
                      onChange={(e) => setBookingData({ ...bookingData, upiId: e.target.value })}
                      className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsBookingModalOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingBooking}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-6 py-5 gap-2"
                >
                  {submittingBooking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Authorizing Payment...
                    </>
                  ) : (
                    <>
                      Pay ${selectedRoom.price * 2} & Confirm Booking <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: Driving License & Selfie Upload / Capture */}
      {step === 2 && selectedReservation && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold">Verification for {selectedReservation.guest?.firstName || "Guest"}</h2>
              <p className="text-xs text-muted-foreground">Upload Driving License & take a live Selfie for AI facial comparison.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="rounded-xl">
              Change Guest
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Driving License Box */}
            <div className="border border-border rounded-2xl p-5 bg-accent/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <FileBadge className="w-4 h-4 text-emerald-500" /> 1. Driving License ID Card
                </div>
                {dlImage && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              </div>

              <div className="relative h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center overflow-hidden bg-card">
                {dlImage ? (
                  <img src={dlImage} alt="Driving License" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <FileBadge className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs font-medium">Upload Driving License Image</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Supports JPG, PNG or Scanned ID</p>
                  </div>
                )}
              </div>

              <label className="block w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "DL")}
                  className="hidden"
                />
                <div className="cursor-pointer text-center py-2 px-4 border border-border hover:bg-accent rounded-xl text-xs font-semibold transition">
                  {dlImage ? "Change Driving License Photo" : "Upload Driving License File"}
                </div>
              </label>
            </div>

            {/* Selfie Verification Box */}
            <div className="border border-border rounded-2xl p-5 bg-accent/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Camera className="w-4 h-4 text-emerald-500" /> 2. Live Selfie Camera Capture
                </div>
                {selfieImage && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              </div>

              <div className="relative h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center overflow-hidden bg-card">
                {isCameraActive ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-xl" />
                ) : selfieImage ? (
                  <img src={selfieImage} alt="Live Selfie" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Camera className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs font-medium">Take a Live Selfie Photo</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Ensures presence of real person</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {isCameraActive ? (
                  <Button onClick={captureSelfie} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs">
                    Snap Selfie Now
                  </Button>
                ) : (
                  <Button onClick={startCamera} variant="outline" className="w-full rounded-xl text-xs font-semibold gap-2">
                    <Camera className="w-3.5 h-3.5" /> Start Webcam
                  </Button>
                )}

                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "SELFIE")}
                    className="hidden"
                  />
                  <div className="cursor-pointer py-2 px-3 border border-border hover:bg-accent rounded-xl text-xs font-semibold transition">
                    Upload
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl text-xs">
              Back
            </Button>
            <Button
              onClick={handleVerifyId}
              disabled={verifying || !dlImage || !selfieImage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-6 gap-2"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Facial Match...
                </>
              ) : (
                <>
                  Verify ID & Facial Score <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Digital Lock Passcode & Room Simulator */}
      {step === 3 && selectedReservation && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Verification Badge */}
          <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg">Identity Verified</h3>
              <p className="text-xs text-muted-foreground">Match score computed with 96% confidence score.</p>
            </div>

            <div className="space-y-3 bg-accent/40 p-4 rounded-xl text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guest Name:</span>
                <span className="font-semibold">{selectedReservation.guest?.firstName || "Guest"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Type:</span>
                <span className="font-semibold">Driving License</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned Room:</span>
                <span className="font-semibold text-emerald-500">Room #{selectedReservation.roomId || "101"}</span>
              </div>
            </div>

            {!keyDetails ? (
              <Button
                onClick={handleGenerateDigitalKey}
                disabled={generatingKey}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold py-5 gap-2"
              >
                {generatingKey ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Issuing Digital Key...
                  </>
                ) : (
                  <>
                    Complete Check-In & Generate Key <KeyRound className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Digital Key Activated!</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Valid for duration of stay.</p>
              </div>
            )}
          </div>

          {/* Digital Key Passcard & Door Simulator */}
          <div className="lg:col-span-2 space-y-6">
            {keyDetails && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 border border-slate-700 text-white rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-700/60 pb-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm tracking-wide uppercase text-slate-300">Contactless Mobile Pass</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    AES-256 GCM
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold">6-Digit Room Door PIN</p>
                      <div className="text-4xl font-mono font-extrabold tracking-widest text-emerald-400 mt-1">
                        {keyDetails.digitalPin}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <p><span className="text-slate-400">Lock ID:</span> {keyDetails.lockId}</p>
                      <p><span className="text-slate-400">Payload Hash:</span> {keyDetails.keyPayload?.encryptedKey?.slice(0, 18)}...</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                    <QrCode className="w-24 h-24 text-white mb-2" />
                    <p className="text-[10px] text-slate-400">Scan at Room Door NFC / QR Sensor</p>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Lock Door Simulator */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 text-center">
              <h3 className="font-bold text-base flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" /> Smart Door Lock Simulator
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Test the digital lock key unlock mechanism for Room #{selectedReservation.roomId || "101"}.
              </p>

              <div className="py-6 flex flex-col items-center justify-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-inner ${
                    doorStatus === "UNLOCKED"
                      ? "bg-emerald-500 text-white ring-8 ring-emerald-500/20 scale-110"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {doorStatus === "UNLOCKED" ? <Unlock className="w-10 h-10 animate-bounce" /> : <Lock className="w-10 h-10" />}
                </div>

                <p className="font-bold text-sm mt-4">
                  Door Status:{" "}
                  <span className={doorStatus === "UNLOCKED" ? "text-emerald-500" : "text-slate-400"}>
                    {doorStatus}
                  </span>
                </p>
              </div>

              <Button
                onClick={handleSimulateUnlock}
                disabled={!keyDetails || unlocking}
                variant={doorStatus === "UNLOCKED" ? "outline" : "default"}
                className="rounded-xl text-xs font-semibold px-8 py-5 gap-2"
              >
                {unlocking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Unlocking Door...
                  </>
                ) : (
                  <>
                    {doorStatus === "UNLOCKED" ? "Door Unlocked!" : "Simulate Unlock Key"} <KeyRound className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
