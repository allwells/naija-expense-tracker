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
  IconChevronUp,
  IconChevronDown,
  IconMinus,
} from "@tabler/icons-react";
import { INCOME_TYPE_LABELS, type IncomeRecord } from "@/types/income";
import { INCOME_TYPE_VARIANT } from "./utils";
import { format, parseISO } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

type SortField = "date" | "amount_ngn";
type SortDirection = "asc" | "desc";

interface IncomeTableProps {
  income: IncomeRecord[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onViewDetail: (income: IncomeRecord) => void;
  onEdit: (income: IncomeRecord) => void;
  onDelete: (income: IncomeRecord) => void;
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

export function IncomeTable({
  income,
  sortField,
  sortDirection,
  onSort,
  onViewDetail,
  onEdit,
  onDelete,
}: IncomeTableProps) {
  const { format: formatAmount } = useCurrency();

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
            <TableHead>Source</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-left">
              <button
                className="flex items-center font-medium hover:text-foreground transition-colors"
                onClick={() => onSort("amount_ngn")}
              >
                Amount (NGN)
                <SortIcon
                  field="amount_ngn"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </TableHead>
            <TableHead>Export?</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {income.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={6}
                className="h-64 text-center text-muted-foreground"
              >
                No income records found.
              </TableCell>
            </TableRow>
          ) : (
            income.map((record) => (
              <TableRow
                key={record.id}
                className="divide-x cursor-pointer transition-colors"
                onClick={() => onViewDetail(record)}
              >
                <TableCell className="font-mono text-sm tabular-nums text-nowrap">
                  {format(parseISO(record.date), "MMMM dd, yyyy")}
                </TableCell>
                <TableCell className="max-w-40 truncate font-medium">
                  {record.source}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      INCOME_TYPE_VARIANT[
                        record.income_type as keyof typeof INCOME_TYPE_VARIANT
                      ] ?? "outline"
                    }
                  >
                    {INCOME_TYPE_LABELS[record.income_type] ??
                      record.income_type}
                  </Badge>
                </TableCell>

                <TableCell className="font-mono tabular-nums">
                  {formatAmount(record.amount_ngn)}
                </TableCell>
                <TableCell>
                  {record.is_export_income ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                      Export
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(record)}
                      title="Edit"
                    >
                      <IconPencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(record)}
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

export function IncomeTableSkeleton() {
  return (
    <div className="hidden md:block border border-border overflow-hidden rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent divide-x">
            <TableHead className="w-40">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead className="w-32">
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-36">
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead className="w-20">
              <Skeleton className="h-4 w-12" />
            </TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i} className="divide-x">
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-14" />
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
