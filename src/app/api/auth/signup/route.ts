import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const sql = getDb();

  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json({ error: "Email, name, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if user already exists
    const [existing] = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Create user
    const [user] = await sql`
      INSERT INTO users (email, name)
      VALUES (${email}, ${name})
      RETURNING id, email, name
    `;

    // Hash and store password
    const hash = await bcrypt.hash(password, 10);
    await sql`
      INSERT INTO user_passwords (user_id, password_hash)
      VALUES (${user.id}, ${hash})
    `;

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
