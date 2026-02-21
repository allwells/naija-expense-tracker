"use client";

import { useEffect, useState } from "react";

/**
 * A simple global event-based trigger to open the expense form from anywhere.
 */
export const openExpenseForm = () => {
  window.dispatchEvent(new CustomEvent("open-expense-form"));
};

interface ExpenseFormWrapperProps {
  children: React.ReactNode;
}

export function ExpenseFormWrapper({ children }: ExpenseFormWrapperProps) {
  return <div onClick={openExpenseForm}>{children}</div>;
}
