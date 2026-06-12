import type { Metadata } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

const DESCRIPTION =
  "Draft a team of 8 pros with your friends before each golf major, then follow live scoring all weekend — plus season-long standings across all four majors.";

export const metadata: Metadata = {
  metadataBase: new URL("https://juicemasters.vercel.app"),
  title: {
    default: "Juice Tour — Fantasy Golf for the Majors",
    template: "%s · Juice Tour",
  },
  description: DESCRIPTION,
  openGraph: {
    siteName: "Juice Tour",
    type: "website",
    url: "/",
    title: "Juice Tour — Fantasy Golf for the Majors",
    description: DESCRIPTION,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Juice Tour" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Juice Tour — Fantasy Golf for the Majors",
    description: DESCRIPTION,
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
