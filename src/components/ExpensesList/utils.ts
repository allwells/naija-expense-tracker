// Badge variants per expense tag
export const TAG_VARIANT: Record<
  string,
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost"
  | "deductible"
  | "capital"
  | "personal"
  | "business"
  | "taxable"
> = {
  deductible: "deductible",
  capital: "capital",
  personal: "personal",
  business: "business",
  taxable: "taxable",
};
