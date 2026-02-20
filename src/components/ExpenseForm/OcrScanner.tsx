"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/format";
import {
  IconScan,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import type { OcrResult, OcrStatus } from "./hooks/use-ocr";

interface OcrScannerProps {
  status: OcrStatus;
  progress: number;
  result: OcrResult | null;
  onAcceptAmount: (amount: number) => void;
  onAcceptDate: (date: string) => void;
}

export function OcrScanner({
  status,
  progress,
  result,
  onAcceptAmount,
  onAcceptDate,
}: OcrScannerProps) {
  if (status === "idle") return null;

  return (
    <div className="space-y-3">
      {/* Processing state */}
      {status === "processing" && (
        <div className="space-y-2 border-2 border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconScan className="size-4 animate-pulse" />
            <span>Scanning receipt… {progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex items-center gap-2 border-2 border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <IconAlertTriangle className="size-4 shrink-0" />
          <span>Could not scan this file. Please enter details manually.</span>
        </div>
      )}

      {/* Done — low confidence */}
      {status === "done" &&
        result &&
        result.amount === null &&
        result.date === null && (
          <div className="flex items-center gap-2 border-2 border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
            <IconAlertTriangle className="size-4 shrink-0" />
            <span>
              Image quality too low to extract values. Please enter manually.
            </span>
          </div>
        )}

      {/* Done — has suggestions */}
      {status === "done" &&
        result &&
        (result.amount !== null || result.date !== null) && (
          <div className="space-y-2 border-2 border-border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              OCR Suggestions — review before using
            </p>

            {result.amount !== null && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Amount detected:</span>
                <span className="font-mono font-semibold">
                  {formatNGN(result.amount)}
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={() => onAcceptAmount(result.amount!)}
                  >
                    <IconCheck className="size-3" />
                    Use
                  </Button>
                </div>
              </div>
            )}

            {result.date !== null && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Date detected:</span>
                <span className="font-mono font-semibold">{result.date}</span>
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={() => onAcceptDate(result.date!)}
                  >
                    <IconCheck className="size-3" />
                    Use
                  </Button>
                </div>
              </div>
            )}

            {result.amount === null && result.date !== null && (
              <p className="text-xs text-muted-foreground">
                Amount not detected — please enter it manually.
              </p>
            )}

            {result.date === null && result.amount !== null && (
              <p className="text-xs text-muted-foreground">
                Date not detected — please enter it manually.
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Confidence: {Math.round(result.confidence)}%
            </p>
          </div>
        )}
    </div>
  );
}
