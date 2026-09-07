import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { PushSetup } from "@/components/notifications/push-setup";
import { TabSessionGuard } from "@/components/auth/tab-session-guard";

export const metadata: Metadata = {
  title: {
    default: "Sampath Food City",
    template: "%s | Sampath Food City",
  },
  description:
    "Shop everyday products from your nearest Sampath Food City branch and get them delivered to your door.",
  applicationName: "Sampath Food City",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/sst-logo.svg",
    shortcut: "/sst-logo.svg",
    apple: "/sst-logo.svg",
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
          <TabSessionGuard>
            {children}
            <div className="fixed right-4 top-4 z-50">
              <NotificationBell />
            </div>
            <PushSetup />
          </TabSessionGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
