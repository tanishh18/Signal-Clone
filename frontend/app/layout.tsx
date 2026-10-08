import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Web",
  description: "Signal-inspired secure messaging web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-white text-zinc-900 dark:bg-[#121212] dark:text-[#f0f0f0]">
        {children}
      </body>
    </html>
  );
}

