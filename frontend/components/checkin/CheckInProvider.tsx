"use client";

import React, { createContext, useContext, useState } from "react";

type CheckInState = {
  token: string;
  idVerified: boolean;
  paymentAuthorized: boolean;
  checkedIn: boolean;
  roomNumber: string | null;
  setIdVerified: (v: boolean) => void;
  setPaymentAuthorized: (v: boolean) => void;
  setCheckedIn: (v: boolean, roomNumber?: string) => void;
};

const CheckInContext = createContext<CheckInState | null>(null);

// Lives in app/checkin/[token]/layout.tsx, which the App Router keeps
// mounted while the guest navigates between /verify, /payment, /review,
// etc. — so this state survives client-side navigation without needing
// localStorage. A hard refresh re-derives it from the server (see the
// guard in layout.tsx), since the server-side checkInStatus is always the
// source of truth, not this context.
export function CheckInProvider({ token, children }: { token: string; children: React.ReactNode }) {
  const [idVerified, setIdVerified] = useState(false);
  const [paymentAuthorized, setPaymentAuthorized] = useState(false);
  const [checkedIn, setCheckedInState] = useState(false);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);

  const setCheckedIn = (v: boolean, room?: string) => {
    setCheckedInState(v);
    if (room) setRoomNumber(room);
  };

  return (
    <CheckInContext.Provider
      value={{
        token,
        idVerified,
        paymentAuthorized,
        checkedIn,
        roomNumber,
        setIdVerified,
        setPaymentAuthorized,
        setCheckedIn,
      }}
    >
      {children}
    </CheckInContext.Provider>
  );
}

export function useCheckIn() {
  const ctx = useContext(CheckInContext);
  if (!ctx) throw new Error("useCheckIn must be used within a CheckInProvider");
  return ctx;
}
