"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  IconUpload,
  IconX,
  IconFileText,
  IconPhoto,
  IconReceipt,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface ReceiptUploaderProps {
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  onOcrStart?: (file: File) => void;
}

export function ReceiptUploader({
  previewUrl,
  onFileSelect,
  onClear,
  onOcrStart,
}: ReceiptUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Unsupported file type", {
          description: "Please upload a JPG, PNG, WebP, HEIC, or PDF file.",
        });
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error("File too large", {
          description:
            "Receipt must be under 10 MB. Try compressing the image first.",
        });
        return;
      }
      onFileSelect(file);
      onOcrStart?.(file);
    },
    [onFileSelect, onOcrStart],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so same file can be re-selected
      e.target.value = "";
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const isImage =
    previewUrl &&
    !previewUrl.endsWith(".pdf") &&
    !previewUrl.includes("application/pdf");

  if (previewUrl) {
    return (
      <div className="relative flex items-center gap-3 border bg-muted/20 p-2 rounded-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border rounded-sm bg-background overflow-hidden">
          <IconReceipt className="size-6 stroke-1 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">Receipt attached</p>
          <p className="text-xs text-muted-foreground">
            {isImage ? "Image" : "PDF"} · click × to remove
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => {
            onClear();
            inputRef.current && (inputRef.current.value = "");
          }}
        >
          <IconX className="size-4" />
          <span className="sr-only">Remove receipt</span>
        </Button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-md p-6 text-center cursor-pointer transition-colors",
        isDragging && "border-primary bg-primary/5",
        "hover:border-primary/60 hover:bg-muted/30",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
    >
      <IconPhoto className="size-10 stroke-1 text-muted-foreground" />

      <div>
        <p className="text-sm font-medium">
          Drop receipt here or{" "}
          <span className="text-primary underline underline-offset-2">
            browse
          </span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          JPG, PNG, WebP, HEIC or PDF · max 10 MB
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-1"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        <IconUpload className="size-4" />
        Choose file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={onInputChange}
        capture="environment"
      />
    </div>
  );
}
