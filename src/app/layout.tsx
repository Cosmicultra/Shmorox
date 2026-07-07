import type { Metadata } from "next";
import { AppProvider } from "@/context/AppContext";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shmorox — Legal Marketing Review",
  description:
    "Enterprise AI-powered legal review for advertising and marketing materials",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
