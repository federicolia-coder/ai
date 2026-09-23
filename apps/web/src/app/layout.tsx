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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tarry-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
