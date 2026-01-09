import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenRAN TCO Modeler",
  description: "Total Cost of Ownership modeling for OpenRAN networks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
