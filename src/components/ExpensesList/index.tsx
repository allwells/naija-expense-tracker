"use client";

import { toast } from "sonner";
import { IconPlus, IconTrendingDown } from "@tabler/icons-react";
import { ExpenseFilters } from "./ExpenseFilters";
import { Button, Skeleton } from "@/components/ui";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseDetailModal } from "./ExpenseDetailModal";
import { useState, useCallback, useMemo, useTransition, useRef } from "react";
import { ExpensesTable, ExpensesTableSkeleton } from "./ExpensesTable";
import { ExpensesCards, ExpensesCardsSkeleton } from "./ExpensesCards";
import { deleteExpenseAction } from "@/app/actions/expense-actions";
import { DeleteConfirmationModal, EmptyState } from "@/components/shared";
import type { ExpenseRecord, PaginatedExpenses } from "@/types/expense";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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

  // Delete state
  const [deleteExpense, setDeleteExpense] = useState<ExpenseRecord | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeletion] = useTransition();

  // Sort state (client-side sort within current page)
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const pullStartYRef = useRef(0);
  const isPullingRef = useRef(false);
  const REFRESH_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only pull to refresh if we are at the top of the page
    if (window.scrollY === 0 && e.touches[0]) {
      pullStartYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || isRefreshing || !e.touches[0]) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - pullStartYRef.current;

    if (diff > 0) {
      // Add resistance
      const resistance = diff < REFRESH_THRESHOLD ? 0.4 : 0.2;
      let newPullY = diff * resistance;

      // Ensure we don't pull too far down
      if (newPullY > REFRESH_THRESHOLD + 20) {
        newPullY = REFRESH_THRESHOLD + 20;
      }

      setPullY(newPullY);

      // Prevent scrolling while pulling down
      if (e.cancelable) {
        e.preventDefault();
      }
    } else {
      setPullY(0);
      isPullingRef.current = false;
    }
  };

  const handleTouchEnd = () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullY >= REFRESH_THRESHOLD) {
      setIsRefreshing(true);
      setPullY(REFRESH_THRESHOLD);

      // Trigger refresh
      router.refresh();

      // Artificial delay for UI feedback
      setTimeout(() => {
        setIsRefreshing(false);
        setPullY(0);
      }, 1000);
    } else {
      setPullY(0);
    }
  };

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

  const openDelete = useCallback((expense: ExpenseRecord) => {
    setDeleteExpense(expense);
    setDeleteOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleteExpense) return;

    startDeletion(async () => {
      const result = await deleteExpenseAction(deleteExpense.id);
      if (result.error) {
        toast.error("Could not delete expense", {
          description: result.error,
        });
        return;
      }

      toast.success("Expense deleted");
      setDeleteOpen(false);
      setDeleteExpense(null);
      // If the detail modal was showing this expense, close it
      if (detailExpense?.id === deleteExpense.id) {
        setDetailOpen(false);
        setDetailExpense(null);
      }
    });
  }, [deleteExpense, detailExpense]);

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
    <div
      className="relative flex flex-col gap-4 min-h-[50vh]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center z-10 overflow-hidden"
        style={{
          height: `${pullY}px`,
          top: `-${pullY}px`,
          transition: isPullingRef.current
            ? "none"
            : "height 0.3s ease-out, top 0.3s ease-out",
        }}
      >
        <div className="flex items-end justify-center pb-4 w-full h-full">
          {isRefreshing ? (
            <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          ) : (
            <div
              className="size-6 rounded-full border-2 border-muted-foreground border-t-transparent transition-transform duration-100"
              style={{ transform: `rotate(${pullY * 4}deg)` }}
            />
          )}
        </div>
      </div>

      <div
        className="transition-transform duration-300 ease-out flex flex-col gap-4"
        style={{
          transform: `translateY(${pullY}px)`,
          transition: isPullingRef.current ? "none" : "transform 0.3s ease-out",
        }}
      >
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
                <Button
                  size="sm"
                  className="hidden md:flex"
                  onClick={openCreate}
                >
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
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={IconTrendingDown}
            title="No expenses found"
            description="Add your first expense to start tracking."
            action={{
              label: "Add Expense",
              onClick: openCreate,
            }}
          />
        ) : (
          <>
            <ExpensesTable
              expenses={sortedExpenses}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onEdit={openEdit}
              onDelete={openDelete}
              onViewReceipt={openDetail}
            />
            <ExpensesCards
              expenses={sortedExpenses}
              onEdit={openEdit}
              onDelete={openDelete}
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
          onDelete={openDelete}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleDelete}
          isPending={isDeleting}
          title="Delete Expense?"
        />
      </div>
    </div>
  );
}
