import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import { AuthProvider } from "@/context/AuthProvider";

import ErrorBoundary from '@/components/ErrorBoundary';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Collab-And-Code",
  description: "New generated code editor with AI-powered suggestions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>   
          <Provider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
