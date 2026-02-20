"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Badge,
  Skeleton,
} from "@/components/ui";
import {
  IconPencil,
  IconTrash,
  IconReceipt,
  IconChevronUp,
  IconChevronDown,
  IconMinus,
} from "@tabler/icons-react";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_TAG_LABELS,
  type ExpenseRecord,
} from "@/types/expense";
import { TAG_VARIANT } from "./utils";
import { format, parseISO } from "date-fns";
import { formatNGN } from "@/lib/format";

type SortField = "date" | "amount_ngn" | "category";
type SortDirection = "asc" | "desc";

interface ExpensesTableProps {
  expenses: ExpenseRecord[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onEdit: (expense: ExpenseRecord) => void;
  onDelete: (expense: ExpenseRecord) => void;
  onViewReceipt: (expense: ExpenseRecord) => void;
}

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) {
  if (sortField !== field)
    return <IconMinus className="ml-1 size-3 opacity-30" />;
  return sortDirection === "asc" ? (
    <IconChevronUp className="ml-1 size-3" />
  ) : (
    <IconChevronDown className="ml-1 size-3" />
  );
}

export function ExpensesTable({
  expenses,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onViewReceipt,
}: ExpensesTableProps) {
  return (
    <div className="hidden md:block border border-border overflow-hidden rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent divide-x">
            <TableHead>
              <button
                className="flex items-center font-medium hover:text-foreground transition-colors"
                onClick={() => onSort("date")}
              >
                Date
                <SortIcon
                  field="date"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead>
              <button
                className="flex items-center font-medium hover:text-foreground transition-colors"
                onClick={() => onSort("category")}
              >
                Category
                <SortIcon
                  field="category"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </TableHead>
            <TableHead>Tag</TableHead>
            <TableHead className="text-left">
              <button
                className="flex items-center font-medium hover:text-foreground transition-colors"
                onClick={() => onSort("amount_ngn")}
              >
                Amount
                <SortIcon
                  field="amount_ngn"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={6}
                className="h-64 text-center text-muted-foreground"
              >
                No expenses found.
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow
                key={expense.id}
                className="divide-x cursor-pointer transition-colors"
                onClick={() => onViewReceipt(expense)}
              >
                <TableCell className="font-mono text-sm tabular-nums text-nowrap">
                  {format(parseISO(expense.date), "MMMM dd, yyyy")}
                </TableCell>
                <TableCell className="max-w-50 truncate">
                  {expense.description ?? "—"}
                </TableCell>
                <TableCell>
                  {EXPENSE_CATEGORY_LABELS[
                    expense.category as keyof typeof EXPENSE_CATEGORY_LABELS
                  ] ?? expense.category}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      TAG_VARIANT[expense.tag as keyof typeof TAG_VARIANT] ??
                      "secondary"
                    }
                  >
                    {EXPENSE_TAG_LABELS[
                      expense.tag as keyof typeof EXPENSE_TAG_LABELS
                    ] ?? expense.tag}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  {formatNGN(expense.amount_ngn)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    {expense.receipt_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onViewReceipt(expense)}
                        title="View receipt"
                      >
                        <IconReceipt className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(expense)}
                      title="Edit"
                    >
                      <IconPencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(expense)}
                      title="Delete"
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function ExpensesTableSkeleton() {
  return (
    <div className="hidden md:block border border-border overflow-hidden rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent divide-x">
            <TableHead className="w-30">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead className="w-38">
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead className="w-25">
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead className="w-30">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i} className="divide-x">
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Skeleton className="h-7 w-7" />
                  <Skeleton className="h-7 w-7" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
