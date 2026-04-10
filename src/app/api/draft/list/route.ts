import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  try {
    const drafts = await sql`SELECT * FROM drafts ORDER BY created_at DESC`;
    return NextResponse.json(drafts);
  } catch (error) {
    console.error("List drafts error:", error);
    return NextResponse.json({ error: "Failed to list drafts" }, { status: 500 });
  }
}
