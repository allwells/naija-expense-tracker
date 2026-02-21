"use client";

import { useEffect, useState } from "react";

/**
 * A simple global event-based trigger to open the income form from anywhere.
 */
export const openIncomeForm = () => {
  window.dispatchEvent(new CustomEvent("open-income-form"));
};

interface IncomeFormWrapperProps {
  children: React.ReactNode;
}

export function IncomeFormWrapper({ children }: IncomeFormWrapperProps) {
  return <div onClick={openIncomeForm}>{children}</div>;
}
