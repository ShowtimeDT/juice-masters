import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Juice Tour Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
