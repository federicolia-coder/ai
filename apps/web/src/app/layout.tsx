import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tarry — AI Assistant by TestardStudios",
  description:
    "Un assistente AI con strumenti, plugin e ricerca web. Leggero, estensibile, tuo.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Tarry — AI Assistant by TestardStudios",
    description:
      "Un assistente AI con strumenti, plugin e ricerca web. Leggero, estensibile, tuo.",
    siteName: "Tarry AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
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
