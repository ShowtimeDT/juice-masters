import { auth } from "@/lib/auth";
import LandingPage from "@/components/marketing/LandingPage";
import LeagueHome from "@/components/LeagueHome";

/**
 * Server component: the login check happens on the server, so anonymous
 * visitors — including search crawlers — receive the full marketing page
 * as real HTML instead of a client-side loading state.
 */
export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return <LandingPage />;
  }

  return <LeagueHome />;
}
