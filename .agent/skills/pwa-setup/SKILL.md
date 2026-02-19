---
name: pwa-setup
description: PWA configuration for NaijaExpense — installable on Android (Chrome) and iOS (Safari). Use when configuring next-pwa, writing manifest.json, adding iOS meta tags to the root layout, generating PWA icons, implementing the beforeinstallprompt install banner hook, preventing iOS input zoom, or defining offline caching behavior. Covers the full setup from next.config.ts to the usePWAInstall hook.
---

# SKILL: PWA Setup (Next.js + Mobile Installable)

## Purpose

Configure NaijaExpense as an installable Progressive Web App (PWA) for Android and iOS.

## Package

```bash
bun add next-pwa
bun add -D webpack
```

## next.config.ts

```typescript
import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "naija-expense-cache",
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  // your other config
};

module.exports = withPWA(nextConfig);
```

## public/manifest.json

```json
{
  "name": "NaijaExpense",
  "short_name": "NaijaExpense",
  "description": "Nigerian business expense tracker with 2026 Tax Reform Act compliance",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#141414",
  "orientation": "portrait-primary",
  "categories": ["finance", "business", "productivity"],
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [],
  "shortcuts": [
    {
      "name": "Add Expense",
      "url": "/expenses?action=add",
      "description": "Quickly add a new expense"
    }
  ]
}
```

## Meta Tags in Root Layout

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NaijaExpense",
  },
  formatDetection: {
    telephone: false,
  },
};

// Also add in <head> via viewport export:
export const viewport: Viewport = {
  themeColor: "#141414",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // prevents zoom on input focus
};
```

## iOS-Specific Tags (in layout.tsx `<head>`)

```tsx
<head>
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="NaijaExpense" />
  <meta name="mobile-web-app-capable" content="yes" />
</head>
```

## PWA Icons

Generate icons using a 512x512 source image. Place in `public/icons/`:

- `icon-192x192.png`
- `icon-512x512.png`
- `apple-touch-icon.png` (180x180)

Use a simple dark background (`#141414`) with a white "₦" symbol or the app logo.

## Mobile Input Zoom Prevention

Add to `globals.css` to prevent iOS zoom on input focus:

```css
@media screen and (max-width: 768px) {
  input[type="text"],
  input[type="number"],
  input[type="email"],
  input[type="date"],
  select,
  textarea {
    font-size: 16px; /* 16px+ prevents iOS zoom */
  }
}
```

## Install Prompt (Chrome Android)

```tsx
// src/hooks/use-pwa-install.ts
"use client";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setCanInstall(false);
    setDeferredPrompt(null);
  };

  return { canInstall, install };
}
```

Show an "Install App" banner in the dashboard when `canInstall` is true:

```tsx
{
  canInstall && (
    <div className="flex items-center justify-between border-2 border-border p-3 bg-muted">
      <span className="text-sm">Install NaijaExpense on your device</span>
      <Button size="sm" onClick={install}>
        Install
      </Button>
    </div>
  );
}
```

## Offline Behavior

- Shell pages (dashboard, expenses list) load from cache
- Form submissions fail gracefully with "No internet connection" toast when offline
- Exchange rates show last cached values with "Offline — showing cached rates" label
