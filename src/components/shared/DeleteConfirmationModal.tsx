"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "@/components/ui";
import { IconTrash } from "@tabler/icons-react";

export interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isPending?: boolean;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete record?",
  description = "This will permanently remove this record. This action cannot be undone.",
  isPending = false,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pt-3.5 px-4 pb-4 sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="leading-tight mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onConfirm}
              loading={isPending}
            >
              {!isPending && <IconTrash className="size-4" />}
              Delete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
