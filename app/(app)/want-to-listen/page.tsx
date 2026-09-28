import type { Metadata } from "next";

import { ListView } from "@/components/lists/list-view";
import { parseListParams } from "@/lib/lists/sort";
import { listEntries } from "@/lib/supabase/entries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Want to Listen",
};

export default async function WantToListenPage({ searchParams }: PageProps<"/want-to-listen">) {
  const [entries, params] = await Promise.all([
    createClient().then((supabase) => listEntries(supabase, "want_to_listen")),
    searchParams.then(parseListParams),
  ]);
  return <ListView title="Want to Listen" status="want_to_listen" entries={entries} initialParams={params} />;
}
