"use client";

import { useState } from "react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import {
  IconDownload,
  IconFileSpreadsheet,
  IconFileZip,
} from "@tabler/icons-react";
import JSZip from "jszip";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { useSearchParams } from "next/navigation";

export function ExportPanel() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const queryParams = new URLSearchParams();
  if (from) queryParams.set("from", from);
  if (to) queryParams.set("to", to);
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const handleDownload = async (
    type: "expenses" | "income" | "tax-summary",
  ) => {
    try {
      setLoading(type);
      toast.loading("Preparing export...", {
        id: "csv-export",
        description: "Building your audit-ready CSV file.",
      });

      const res = await fetch(`/api/export/${type}${query}`);
      if (!res.ok) throw new Error("Failed to generate export");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      a.download = `${type}-${year}-${month}.csv`;

      a.click();
      URL.revokeObjectURL(url);

      toast.success("Export ready", {
        id: "csv-export",
        description:
          "Your file has been downloaded. Check your Downloads folder.",
      });
    } catch (e: any) {
      toast.error("Export failed", {
        id: "csv-export",
        description: "Could not generate the export. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setLoading("zip");
      toast.loading("Preparing export...", {
        id: "csv-export",
        description: "Building your audit-ready ZIP file.",
      });

      const zip = new JSZip();
      const types = ["expenses", "income", "tax-summary"] as const;

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");

      await Promise.all(
        types.map(async (type) => {
          const res = await fetch(`/api/export/${type}${query}`);
          if (!res.ok) throw new Error(`Failed to fetch ${type}`);
          const blob = await res.blob();
          zip.file(`${type}-${year}-${month}.csv`, blob);
        }),
      );

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `audit-package-${year}-${month}.zip`);

      toast.success("Export ready", {
        id: "csv-export",
        description:
          "Your file has been downloaded. Check your Downloads folder.",
      });
    } catch (e: any) {
      toast.error("Export failed", {
        id: "csv-export",
        description: "Could not generate the export. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed">
          <IconDownload className="size-4" />
          Export
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Export Data</h4>
            <p className="text-sm text-muted-foreground tracking-wide">
              Download your records and FIRS tax summary.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => handleDownload("expenses")}
              disabled={loading !== null}
            >
              <IconFileSpreadsheet className="size-4" />
              {loading === "expenses" ? "Generating..." : "Expenses CSV"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => handleDownload("income")}
              disabled={loading !== null}
            >
              <IconFileSpreadsheet className="size-4" />
              {loading === "income" ? "Generating..." : "Income CSV"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => handleDownload("tax-summary")}
              disabled={loading !== null}
            >
              <IconFileSpreadsheet className="size-4" />
              {loading === "tax-summary" ? "Generating..." : "Tax Summary CSV"}
            </Button>
            <div className="h-px bg-border my-1" />
            <Button
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleDownloadZip}
              disabled={loading !== null}
            >
              <IconFileZip className="size-4" />
              {loading === "zip" ? "Generating..." : "Full Audit Package (ZIP)"}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Estimated size: &lt; 1 MB
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
