import { BottomNav } from "@/components/nav/bottom-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Bottom padding keeps content clear of the fixed nav */}
      <div className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </>
  );
}
