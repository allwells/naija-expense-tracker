---
name: ocr-receipt
description: Tesseract.js OCR pipeline for extracting amount and date from uploaded receipt images. Use when building the receipt upload flow, implementing the useOcr hook, writing amount/date regex extraction logic, handling PDF-to-image conversion, or designing the "suggested values" UX pattern where OCR results are shown as accept/reject options rather than auto-filling form fields.
---

# SKILL: OCR Receipt Scanning (Tesseract.js)

## Purpose

Extract amount and date from uploaded receipt images using Tesseract.js, running entirely client-side in a Web Worker.

## Architecture

OCR runs in the browser. Zero server round-trips for scanning.

```
User uploads image → ReceiptUploader → use-ocr hook → Tesseract Web Worker
→ raw text → extract amount + date → show as "Suggested" in form fields
```

## Implementation

### Hook: `src/components/ExpenseForm/hooks/use-ocr.ts`

```typescript
import { useState, useCallback } from "react";
import Tesseract from "tesseract.js";

export type OcrStatus = "idle" | "processing" | "done" | "error";

export interface OcrResult {
  amount: number | null;
  date: string | null; // ISO format YYYY-MM-DD
  rawText: string;
  confidence: number;
}

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
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const extracted = extractFromText(data.text);
      setResult({
        ...extracted,
        rawText: data.text,
        confidence: data.confidence,
      });
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
```

### Amount Extraction Logic

```typescript
function extractAmount(text: string): number | null {
  // Patterns to try in order (most specific first)
  const patterns = [
    // ₦ symbol directly before amount
    /₦\s*([\d,]+(?:\.\d{2})?)/,
    // NGN prefix
    /NGN\s*([\d,]+(?:\.\d{2})?)/i,
    // Total: / Amount: / Grand Total: labels
    /(?:grand\s+total|total\s+amount|total|amount\s+due|amount\s+paid|balance\s+due)[:\s]+(?:₦|NGN|N)?\s*([\d,]+(?:\.\d{2})?)/i,
    // N followed by amount (common in Nigerian receipts)
    /\bN\s*([\d,]+(?:\.\d{2})?)/,
    // Standalone large numbers that look like amounts
    /\b([\d,]{4,}(?:\.\d{2})?)\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const cleaned = match[1].replace(/,/g, "");
      const value = parseFloat(cleaned);
      if (!isNaN(value) && value > 0) return value;
    }
  }
  return null;
}
```

### Date Extraction Logic

```typescript
function extractDate(text: string): string | null {
  const patterns: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    // DD/MM/YYYY or DD-MM-YYYY
    [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      (m) => `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`,
    ],
    // YYYY-MM-DD (ISO)
    [/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/, (m) => `${m[1]}-${m[2]}-${m[3]}`],
    // DD Month YYYY (e.g., 15 January 2026)
    [
      /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
      (m) => {
        const months: Record<string, string> = {
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
        return `${m[3]}-${months[m[2].toLowerCase()]}-${m[1].padStart(2, "0")}`;
      },
    ],
    // Month DD, YYYY
    [
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
      (m) => {
        const months: Record<string, string> = {
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
        return `${m[3]}-${months[m[1].toLowerCase()]}-${m[2].padStart(2, "0")}`;
      },
    ],
  ];

  for (const [pattern, transform] of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const dateStr = transform(match);
        const date = new Date(dateStr);
        // Validate: must be a real date and within reasonable range (2020–2030)
        if (
          !isNaN(date.getTime()) &&
          date.getFullYear() >= 2020 &&
          date.getFullYear() <= 2030
        ) {
          return dateStr;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

function extractFromText(text: string): Pick<OcrResult, "amount" | "date"> {
  return {
    amount: extractAmount(text),
    date: extractDate(text),
  };
}
```

## UX Pattern for Suggested Values

When OCR returns results, show them as suggestions — never auto-fill silently:

```typescript
// In ExpenseFormFields.tsx
{ocrResult?.amount && (
  <div className="flex items-center gap-2 p-2 bg-muted border-2 border-border text-sm">
    <span className="text-muted-foreground">OCR detected amount:</span>
    <span className="font-mono font-semibold">₦{ocrResult.amount.toLocaleString()}</span>
    <Button size="sm" variant="outline" onClick={() => form.setValue('amount_ngn', ocrResult.amount)}>
      Use this
    </Button>
  </div>
)}
```

## File Type Handling

- Accept: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `application/pdf`
- For PDF: use `pdfjsLib` to render first page to canvas, then pass canvas to Tesseract
- For HEIC (iPhone photos): convert to JPEG using `heic2any` before processing
- Max file size: 10MB — reject and show error if exceeded

## Progress UX

Show a progress bar during OCR processing:

```tsx
{
  ocrStatus === "processing" && (
    <div className="space-y-2">
      <Progress value={ocrProgress} className="h-2" />
      <p className="text-xs text-muted-foreground">
        Scanning receipt... {ocrProgress}%
      </p>
    </div>
  );
}
```

## Known Limitations to Handle Gracefully

- Low-quality photos: OCR confidence will be low → show "Could not extract values, please enter manually"
- Handwritten receipts: will likely fail → same fallback message
- Threshold: if `data.confidence < 30`, treat as failed extraction
