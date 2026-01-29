import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { FirebaseAuthProvider } from "./components/FirebaseAuthProvider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
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
        className={`${outfit.variable} antialiased`}
      >
        <FirebaseAuthProvider>
          {children}
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
