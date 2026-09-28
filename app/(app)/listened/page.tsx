import type { Metadata } from "next";

import { ListView } from "@/components/lists/list-view";
import { parseListParams } from "@/lib/lists/sort";
import { listEntries } from "@/lib/supabase/entries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Listened",
};

export default async function ListenedPage({ searchParams }: PageProps<"/listened">) {
  const [entries, params] = await Promise.all([
    createClient().then((supabase) => listEntries(supabase, "listened")),
    searchParams.then(parseListParams),
  ]);
  return <ListView title="Listened" status="listened" entries={entries} initialParams={params} />;
}
