import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SocketListener } from "@/components/SocketListener";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Saksham OS | Agentic AI for Freelancers",
  description: "The first Autonomous Financial Guardian for the Gig Economy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <SocketListener />
          {children}
        </Providers>
      </body>
    </html>
  );
}
