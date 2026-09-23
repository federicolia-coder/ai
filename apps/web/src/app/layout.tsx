import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tarry — Your AI, beyond the chat",
  description:
    "A lightweight AI assistant that uses tools, plugins, web, files, and APIs. By TestardStudios.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
