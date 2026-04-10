"use client";

import { useState, useEffect } from "react";
import PasswordGate from "@/components/admin/PasswordGate";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("adminPassword");
    if (stored) setAdminPassword(stored);
  }, []);

  if (!adminPassword) {
    return <PasswordGate onAuthenticated={setAdminPassword} />;
  }

  return <AdminDashboard adminPassword={adminPassword} />;
}
