import type { Metadata } from "next";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/context/toast-context";
import ToastContainer from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "Falcore VTS",
  description: "Vehicle Tracking System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-8 overflow-auto">{children}</main>
          </div>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
