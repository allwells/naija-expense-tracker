"use client";

import { useState, useCallback } from "react";
import Tesseract from "tesseract.js";

export type OcrStatus = "idle" | "processing" | "done" | "error";

export interface OcrResult {
  amount: number | null;
  date: string | null; // ISO YYYY-MM-DD
  rawText: string;
  confidence: number;
}

// ----------------------------------------------------------------
// Amount extraction
// ----------------------------------------------------------------

function extractAmount(text: string): number | null {
  const patterns = [
    /₦\s*([\d,]+(?:\.\d{2})?)/,
    /NGN\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:grand\s+total|total\s+amount|total|amount\s+due|amount\s+paid|balance\s+due)[:\s]+(?:₦|NGN|N)?\s*([\d,]+(?:\.\d{2})?)/i,
    /\bN\s*([\d,]+(?:\.\d{2})?)/,
    /\b([\d,]{4,}(?:\.\d{2})?)\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const captured = match?.[1];
    if (captured) {
      const cleaned = captured.replace(/,/g, "");
      const value = parseFloat(cleaned);
      if (!isNaN(value) && value > 0) return value;
    }
  }
  return null;
}

// ----------------------------------------------------------------
// Date extraction
// ----------------------------------------------------------------

const MONTH_MAP: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
};

function extractDate(text: string): string | null {
  // Pattern 1: DD/MM/YYYY or DD-MM-YYYY
  const p1 = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (p1 && p1[1] && p1[2] && p1[3]) {
    const d = `${p1[3]}-${p1[2].padStart(2, "0")}-${p1[1].padStart(2, "0")}`;
    const parsed = new Date(d);
    if (
      !isNaN(parsed.getTime()) &&
      parsed.getFullYear() >= 2020 &&
      parsed.getFullYear() <= 2030
    )
      return d;
  }

  // Pattern 2: YYYY-MM-DD or YYYY/MM/DD
  const p2 = text.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (p2 && p2[1] && p2[2] && p2[3]) {
    const d = `${p2[1]}-${p2[2]}-${p2[3]}`;
    const parsed = new Date(d);
    if (
      !isNaN(parsed.getTime()) &&
      parsed.getFullYear() >= 2020 &&
      parsed.getFullYear() <= 2030
    )
      return d;
  }

  // Pattern 3: 12 January 2024
  const p3 = text.match(
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
  );
  if (p3 && p3[1] && p3[2] && p3[3]) {
    const month = MONTH_MAP[p3[2].toLowerCase()];
    if (month) {
      const d = `${p3[3]}-${month}-${p3[1].padStart(2, "0")}`;
      const parsed = new Date(d);
      if (
        !isNaN(parsed.getTime()) &&
        parsed.getFullYear() >= 2020 &&
        parsed.getFullYear() <= 2030
      )
        return d;
    }
  }

  // Pattern 4: January 12, 2024
  const p4 = text.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
  );
  if (p4 && p4[1] && p4[2] && p4[3]) {
    const month = MONTH_MAP[p4[1].toLowerCase()];
    if (month) {
      const d = `${p4[3]}-${month}-${p4[2].padStart(2, "0")}`;
      const parsed = new Date(d);
      if (
        !isNaN(parsed.getTime()) &&
        parsed.getFullYear() >= 2020 &&
        parsed.getFullYear() <= 2030
      )
        return d;
    }
  }

  return null;
}

// ----------------------------------------------------------------
// Hook
// ----------------------------------------------------------------

export function useOcr() {
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OcrResult | null>(null);

  const processImage = useCallback(async (file: File) => {
    setStatus("processing");
    setProgress(0);
    setResult(null);

    try {
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const amount = extractAmount(data.text);
      const date = extractDate(data.text);

      // Treat confidence < 30 as failed extraction
      if (data.confidence < 30) {
        setResult({
          amount: null,
          date: null,
          rawText: data.text,
          confidence: data.confidence,
        });
      } else {
        setResult({
          amount,
          date,
          rawText: data.text,
          confidence: data.confidence,
        });
      }

      setStatus("done");
    } catch (err) {
      console.error("OCR failed:", err);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setResult(null);
  }, []);

  return { status, progress, result, processImage, reset };
}
