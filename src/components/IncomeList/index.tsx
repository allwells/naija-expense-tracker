"use client";

import { toast } from "sonner";
import { IconPlus, IconTrendingUp } from "@tabler/icons-react";
import { Button, Skeleton } from "@/components/ui";
import { IncomeForm } from "@/components/IncomeForm";
import { IncomeDetailModal } from "./IncomeDetailModal";
import {
  useState,
  useCallback,
  useMemo,
  useTransition,
  useRef,
  useEffect,
} from "react";
import { IncomeTable, IncomeTableSkeleton } from "./IncomeTable";
import { IncomeCards, IncomeCardsSkeleton } from "./IncomeCards";
import { deleteIncomeAction } from "@/app/actions/income-actions";
import { DeleteConfirmationModal, EmptyState } from "@/components/shared";
import type { IncomeRecord, PaginatedIncome } from "@/types/income";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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

  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const pullStartYRef = useRef(0);
  const isPullingRef = useRef(false);
  const REFRESH_THRESHOLD = 80;

  useEffect(() => {
    const handleOpenForm = () => {
      setEditIncome(undefined);
      setFormOpen(true);
    };
    window.addEventListener("open-income-form", handleOpenForm);
    return () => window.removeEventListener("open-income-form", handleOpenForm);
  }, []);

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
        {/* Meta info row */}
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          ) : (
            `${total} record${total !== 1 ? "s" : ""}`
          )}
        </div>

        {/* Lists */}
        {isLoading ? (
          <>
            <IncomeTableSkeleton />
            <IncomeCardsSkeleton />
          </>
        ) : income.length === 0 ? (
          <EmptyState
            icon={IconTrendingUp}
            title="No income records found"
            description="Add your first income to start tracking."
            action={{
              label: "Add Income",
              onClick: openCreate,
            }}
          />
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
    </div>
  );
}
