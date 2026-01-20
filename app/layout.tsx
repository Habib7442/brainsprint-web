import type { Metadata } from "next";
import { rubik, spaceMono } from "./fonts";
import "./globals.css";

import { SWRegister } from "@/components/SWRegister";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "BrainSprint | AxomPrep",
  description: "Think Faster. Solve Smarter. Win Exams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${rubik.variable} ${spaceMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SWRegister />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
