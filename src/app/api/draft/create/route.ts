import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const sql = getDb();
  try {
    const { tournament_id, name } = await request.json();
    const id = `draft-${tournament_id}-${Date.now()}`;

    await sql`
      INSERT INTO drafts (id, tournament_id, name, status)
      VALUES (${id}, ${tournament_id}, ${name}, 'open')
    `;

    const [draft] = await sql`SELECT * FROM drafts WHERE id = ${id}`;
    return NextResponse.json(draft);
  } catch (error) {
    console.error("Create draft error:", error);
    return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
  }
}
