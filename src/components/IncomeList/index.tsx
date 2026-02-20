"use client";

import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";
import { IncomeFilters } from "./IncomeFilters";
import { Button, Skeleton } from "@/components/ui";
import { IncomeForm } from "@/components/IncomeForm";
import { IncomeDetailModal } from "./IncomeDetailModal";
import { useState, useCallback, useMemo, useTransition } from "react";
import { IncomeTable, IncomeTableSkeleton } from "./IncomeTable";
import { IncomeCards, IncomeCardsSkeleton } from "./IncomeCards";
import { deleteIncomeAction } from "@/app/actions/income-actions";
import { DeleteConfirmationModal } from "@/components/shared";
import type { IncomeRecord, PaginatedIncome } from "@/types/income";

interface IncomeListProps {
  paginatedIncome: PaginatedIncome;
  isLoading?: boolean;
}

type SortField = "date" | "amount_ngn";
type SortDirection = "asc" | "desc";

export function IncomeList({
  paginatedIncome,
  isLoading = false,
}: IncomeListProps) {
  const {
    income,
    total,
    page,
    pageSize: _pageSize,
    totalPages,
  } = paginatedIncome;

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editIncome, setEditIncome] = useState<IncomeRecord | undefined>(
    undefined,
  );

  // Detail modal state
  const [detailIncome, setDetailIncome] = useState<IncomeRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Delete state
  const [deleteIncome, setDeleteIncome] = useState<IncomeRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeletion] = useTransition();

  // Sort state (client-side sort within current page)
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const openCreate = useCallback(() => {
    setEditIncome(undefined);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((record: IncomeRecord) => {
    setEditIncome(record);
    setDetailOpen(false);
    setFormOpen(true);
  }, []);

  const openDetail = useCallback((record: IncomeRecord) => {
    setDetailIncome(record);
    setDetailOpen(true);
  }, []);

  const openDelete = useCallback((record: IncomeRecord) => {
    setDeleteIncome(record);
    setDeleteOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleteIncome) return;

    startDeletion(async () => {
      const result = await deleteIncomeAction(deleteIncome.id);
      if (result.error) {
        toast.error("Could not delete income", {
          description: result.error,
        });
        return;
      }

      toast.success("Income entry removed");
      setDeleteOpen(false);
      setDeleteIncome(null);
      if (detailIncome?.id === deleteIncome.id) {
        setDetailOpen(false);
        setDetailIncome(null);
      }
    });
  }, [deleteIncome, detailIncome]);

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

  const sortedIncome = useMemo(() => {
    return [...income].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = a.date.localeCompare(b.date);
      } else if (sortField === "amount_ngn") {
        cmp = a.amount_ngn - b.amount_ngn;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [income, sortField, sortDirection]);

  return (
    <div className="relative flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          ) : (
            `${total} record${total !== 1 ? "s" : ""}`
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
              <IncomeFilters />
              <Button size="sm" className="hidden md:flex" onClick={openCreate}>
                <IconPlus className="size-4" />
                Add Income
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Lists */}
      {isLoading ? (
        <>
          <IncomeTableSkeleton />
          <IncomeCardsSkeleton />
        </>
      ) : (
        <>
          <IncomeTable
            income={sortedIncome}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onViewDetail={openDetail}
            onEdit={openEdit}
            onDelete={openDelete}
          />
          <IncomeCards
            income={sortedIncome}
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
        aria-label="Add income"
        className="fixed bottom-21 right-4 z-40 flex h-10 w-10 items-center justify-center border-2 border-primary bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden rounded-md"
        onClick={openCreate}
      >
        <IconPlus className="size-5" />
      </button>

      {/* Income Form Sheet */}
      <IncomeForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditIncome(undefined);
        }}
        income={editIncome}
      />

      {/* Detail Dialog */}
      <IncomeDetailModal
        income={detailIncome}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailIncome(null);
        }}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmationModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete Income Record?"
      />
    </div>
  );
}
