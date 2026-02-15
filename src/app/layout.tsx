import type { Metadata } from "next";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/context/toast-context";
import ToastContainer from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "Falcore Backed Test",
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
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-4 pt-18 overflow-auto lg:p-8 lg:pt-8">{children}</main>
          </div>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
