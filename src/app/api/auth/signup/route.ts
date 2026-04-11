import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const sql = getDb();

  try {
    const { email, name, username, password } = await request.json();

    if (!email || !name || !username || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });
    }

    // Check if email already exists
    const [existingEmail] = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existingEmail) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Check if username already exists
    const [existingUsername] = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existingUsername) {
      return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
    }

    // Create user
    const [user] = await sql`
      INSERT INTO users (email, name, username)
      VALUES (${email}, ${name}, ${username})
      RETURNING id, email, name, username
    `;

    // Hash and store password
    const hash = await bcrypt.hash(password, 10);
    await sql`
      INSERT INTO user_passwords (user_id, password_hash)
      VALUES (${user.id}, ${hash})
    `;

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, username: user.username } });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
