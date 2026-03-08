import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meet2Code",
  description: "Agentic meeting-to-PR pipeline — monitor tasks, plans, and pull requests in real time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen w-full bg-zinc-950 font-sans text-zinc-100 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
            <Header />
            <div className="flex-1 overflow-y-auto w-full p-6 md:p-8">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
