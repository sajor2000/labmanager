import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { ToastContainer } from "@/components/ui/toast";
import { UserProvider } from "@/lib/contexts/user-context";
import { LabProvider } from "@/lib/contexts/lab-context";
import { RouteGuard } from "@/components/auth/route-guard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rush Labs Research Management",
  description: "Research management platform for RHEDAS & RICCC at Rush University Medical Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <LabProvider>
              <ErrorBoundary>
                <RouteGuard>
                  <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex flex-1 flex-col">
                      <TopNav />
                      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                        {children}
                      </main>
                    </div>
                  </div>
                </RouteGuard>
                <ToastContainer />
              </ErrorBoundary>
            </LabProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}