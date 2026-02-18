import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Workflow Social Poster",
  description: "Automate social media posts with visual workflows",
};

import NextAuthSessionProvider from "@/components/providers/SessionProvider";
import { FacebookSDKProvider } from "@/components/providers/FacebookSDKProvider";
import DataSyncProvider from "@/components/providers/DataSyncProvider";
import { Toaster } from "@/components/ui/sonner"; // Assuming sonner is used, if not I'll check.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthSessionProvider>
          <DataSyncProvider>
            <FacebookSDKProvider>
              {children}
              <Toaster />
            </FacebookSDKProvider>
          </DataSyncProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
