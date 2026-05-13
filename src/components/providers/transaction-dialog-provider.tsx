"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface TransactionDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TransactionDialogContext = createContext<TransactionDialogContextType>({
  open: false,
  setOpen: () => {},
});

export function useTransactionDialog() {
  return useContext(TransactionDialogContext);
}

export function TransactionDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <TransactionDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </TransactionDialogContext.Provider>
  );
}
