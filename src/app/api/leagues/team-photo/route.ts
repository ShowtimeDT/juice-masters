import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser, authzError } from "@/lib/authz";

// Client resizes to 256px JPEG before upload (~30KB); cap well above that.
const MAX_PHOTO_BYTES = 150_000;

function isValidPhoto(photo: unknown): photo is string {
  return (
    typeof photo === "string" &&
    (photo.startsWith("data:image/jpeg;base64,") || photo.startsWith("data:image/png;base64,")) &&
    photo.length <= MAX_PHOTO_BYTES
  );
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user.ok) return authzError(user);

  const sql = getDb();

  try {
    const { league_id, photo } = await request.json();

    if (!league_id) {
      return NextResponse.json({ error: "League ID is required" }, { status: 400 });
    }
    // null clears the photo; anything else must be a small image data URL.
    if (photo !== null && !isValidPhoto(photo)) {
      return NextResponse.json(
        { error: "Photo must be a JPEG or PNG under 150KB" },
        { status: 400 }
      );
    }

    const updated = await sql`
      UPDATE league_members SET team_photo = ${photo}
      WHERE league_id = ${league_id} AND user_id = ${user.userId}
      RETURNING id
    `;
    if (updated.length === 0) {
      return NextResponse.json({ error: "You are not a member of this league" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team photo error:", error);
    return NextResponse.json({ error: "Failed to update team photo" }, { status: 500 });
  }
}
