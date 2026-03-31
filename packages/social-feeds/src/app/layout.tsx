export const dynamic = 'force-dynamic';
import "./globals.css";
import { Suspense } from "react";

import NextAuthSessionProvider from "@/components/providers/SessionProvider";
import DataSyncProvider from "@/components/providers/DataSyncProvider";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Workflow Social Poster</title>
        <meta name="description" content="Automate social media posts with visual workflows" />
      </head>
      <body style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <Suspense fallback={null}>
          <NextAuthSessionProvider>
            <DataSyncProvider>
              {children}
              <Toaster />
            </DataSyncProvider>
          </NextAuthSessionProvider>
        </Suspense>
      </body>
    </html>
  );
}
