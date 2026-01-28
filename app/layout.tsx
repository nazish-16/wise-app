import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FirebaseAuthProvider } from "./components/FirebaseAuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wise - Smart Finance Dashboard",
  description: "A micro-decision finance dashboard. Make better spending decisions in the moment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FirebaseAuthProvider>
          {children}
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
