import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { PushSetup } from "@/components/notifications/push-setup";

export const metadata: Metadata = {
  title: {
    default: "Budget Go",
    template: "%s | Budget Go",
  },
  description:
    "Shop everyday products from your nearest Budget Go branch and get them delivered to your door.",
  applicationName: "Budget Go",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 text-zinc-950 antialiased transition-colors duration-300 dark:bg-[#08080b] dark:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
          <PushSetup />
        </ThemeProvider>
      </body>
    </html>
  );
}