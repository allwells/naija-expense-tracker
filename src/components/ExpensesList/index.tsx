"use client";

import { useState, useCallback, useMemo } from "react";
import { Button, Skeleton } from "@/components/ui";
import { IconPlus } from "@tabler/icons-react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpensesTable, ExpensesTableSkeleton } from "./ExpensesTable";
import { ExpensesCards, ExpensesCardsSkeleton } from "./ExpensesCards";
import { ExpenseFilters } from "./ExpenseFilters";
import { ExpenseDetailModal } from "./ExpenseDetailModal";
import type { ExpenseRecord, PaginatedExpenses } from "@/types/expense";

interface ExpensesListProps {
  paginatedExpenses: PaginatedExpenses;
  isLoading?: boolean;
}

type SortField = "date" | "amount_ngn" | "category";
type SortDirection = "asc" | "desc";

export function ExpensesList({
  paginatedExpenses,
  isLoading = false,
}: ExpensesListProps) {
  const { expenses, total, page, pageSize, totalPages } = paginatedExpenses;

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseRecord | undefined>(
    undefined,
  );

  // Detail modal state
  const [detailExpense, setDetailExpense] = useState<ExpenseRecord | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  // Sort state (client-side sort within current page)
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const openCreate = useCallback(() => {
    setEditExpense(undefined);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((expense: ExpenseRecord) => {
    setEditExpense(expense);
    setDetailOpen(false);
    setFormOpen(true);
  }, []);

  const openDetail = useCallback((expense: ExpenseRecord) => {
    setDetailExpense(expense);
    setDetailOpen(true);
  }, []);

  const openDeleteFromDetail = useCallback((expense: ExpenseRecord) => {
    setDetailExpense(expense);
    setDetailOpen(true);
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField],
  );

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = a.date.localeCompare(b.date);
      } else if (sortField === "amount_ngn") {
        cmp = a.amount_ngn - b.amount_ngn;
      } else if (sortField === "category") {
        cmp = a.category.localeCompare(b.category);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [expenses, sortField, sortDirection]);

  return (
    <div className="relative flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          ) : (
            `${total} expense${total !== 1 ? "s" : ""}`
          )}
        </div>

        <div className="w-fit flex justify-center items-center gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="hidden md:block h-8 w-32" />
            </>
          ) : (
            <>
              {/* Filters */}
              <ExpenseFilters />

              {/* Desktop add button */}
              <Button size="sm" className="hidden md:flex" onClick={openCreate}>
                <IconPlus className="size-4" />
                Add Expense
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Lists */}
      {isLoading ? (
        <>
          <ExpensesTableSkeleton />
          <ExpensesCardsSkeleton />
        </>
      ) : (
        <>
          <ExpensesTable
            expenses={sortedExpenses}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEdit={openEdit}
            onDelete={(e) => openDeleteFromDetail(e)}
            onViewReceipt={openDetail}
          />
          <ExpensesCards
            expenses={sortedExpenses}
            onEdit={openEdit}
            onDelete={(e) => openDeleteFromDetail(e)}
            onViewDetail={openDetail}
          />
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("page", String(page - 1));
              window.history.pushState({}, "", `?${params.toString()}`);
              window.location.reload();
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground font-mono">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("page", String(page + 1));
              window.history.pushState({}, "", `?${params.toString()}`);
              window.location.reload();
            }}
          >
            Next
          </Button>
        </div>
      )}

      {/* Mobile FAB */}
      <button
        aria-label="Add expense"
        className="fixed bottom-21 right-4 z-40 flex h-10 w-10 items-center justify-center border-2 border-primary bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden rounded-md"
        onClick={openCreate}
      >
        <IconPlus className="size-5" />
      </button>

      {/* Expense Form Sheet */}
      <ExpenseForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditExpense(undefined);
        }}
        expense={editExpense}
      />

      {/* Detail Dialog */}
      <ExpenseDetailModal
        expense={detailExpense}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailExpense(null);
        }}
        onEdit={openEdit}
      />
    </div>
  );
}
