import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const authorized = password === process.env.ADMIN_PASSWORD;
    return NextResponse.json({ authorized });
  } catch {
    return NextResponse.json({ authorized: false }, { status: 400 });
  }
}
