import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser, authzError } from "@/lib/authz";
import { cleanName, cleanUsername } from "@/lib/validate";

/** The caller's own account profile. */
export async function GET() {
  const user = await requireUser();
  if (!user.ok) return authzError(user);

  const sql = getDb();

  try {
    const [row] = await sql`
      SELECT name, username, email FROM users WHERE id = ${user.userId}
    `;
    if (!row) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    return NextResponse.json({
      name: row.name,
      username: row.username,
      email: row.email,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

/** Update the caller's display name and/or username. */
export async function PATCH(request: NextRequest) {
  const user = await requireUser();
  if (!user.ok) return authzError(user);

  const sql = getDb();

  try {
    const body = await request.json();

    // Only touch the fields the client sent, so name and username can be
    // updated independently.
    const wantsName = "name" in body;
    const wantsUsername = "username" in body;

    const name = wantsName ? cleanName(body.name) : null;
    if (wantsName && name === null) {
      return NextResponse.json(
        { error: "Display name is required (max 120 chars)" },
        { status: 400 }
      );
    }

    // An empty username clears the handle; otherwise it must be valid.
    const clearsUsername =
      wantsUsername && (body.username === null || String(body.username).trim() === "");
    const username = wantsUsername && !clearsUsername ? cleanUsername(body.username) : null;
    if (wantsUsername && !clearsUsername && username === null) {
      return NextResponse.json(
        { error: "Usernames are 3–30 letters, numbers, or underscores" },
        { status: 400 }
      );
    }

    if (!wantsName && !wantsUsername) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    if (wantsName) {
      await sql`UPDATE users SET name = ${name} WHERE id = ${user.userId}`;
    }
    if (wantsUsername) {
      await sql`
        UPDATE users SET username = ${clearsUsername ? null : username}
        WHERE id = ${user.userId}
      `;
    }

    return NextResponse.json({ success: true, name, username });
  } catch (error) {
    // Unique-constraint violation on users.username → the handle is taken.
    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
    }
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
