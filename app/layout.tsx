import type { Metadata } from "next";
import { rubik, spaceMono } from "./fonts";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "BrainSprint | AxomPrep",
  description: "Think Faster. Solve Smarter. Win Exams.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BrainSprint",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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

        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
