import type { Metadata } from "next";
import { getDb } from "@/lib/db";

/**
 * Server layout for league pages: looks up the league name so browser
 * tabs, search results, and shared links read "<League> · Juice Tour".
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const sql = getDb();
    const [league] = await sql`
      SELECT name FROM leagues WHERE slug = ${slug} OR id::text = ${slug}
    `;
    if (league?.name) {
      return { title: league.name as string };
    }
  } catch {
    // fall through to the default title
  }
  return { title: "League" };
}

export default function LeagueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
