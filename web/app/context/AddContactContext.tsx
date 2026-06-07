"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AddContactSheet } from "../components/AddContactSheet";

type AddContactContextValue = {
  open: boolean;
  openAddContact: () => void;
  closeAddContact: () => void;
};

const AddContactContext = createContext<AddContactContextValue | null>(null);

export function AddContactProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openAddContact = useCallback(() => setOpen(true), []);
  const closeAddContact = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openAddContact, closeAddContact }),
    [open, openAddContact, closeAddContact]
  );

  return (
    <AddContactContext.Provider value={value}>
      {children}
      {open ? <AddContactSheet onClose={closeAddContact} /> : null}
    </AddContactContext.Provider>
  );
}

export function useAddContact() {
  const ctx = useContext(AddContactContext);
  if (!ctx) {
    throw new Error("useAddContact must be used within AddContactProvider");
  }
  return ctx;
}
