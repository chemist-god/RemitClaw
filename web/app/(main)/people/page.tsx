import dynamic from "next/dynamic";
import { Suspense } from "react";
import { AppHeader } from "../../components/AppHeader";
import { PhoneShell } from "../../components/PhoneShell";

const AddContactAutoOpen = dynamic(
  () =>
    import("../../components/AddContactAutoOpen").then(
      (m) => m.AddContactAutoOpen
    ),
  { ssr: false }
);

const PeopleList = dynamic(
  () => import("../../components/PeopleList").then((m) => m.PeopleList),
  {
    loading: () => (
      <div className="mt-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-surface-subtle p-3"
          >
            <div className="h-12 w-12 animate-pulse rounded-full bg-line" />
            <div className="h-4 w-32 animate-pulse rounded bg-line" />
          </div>
        ))}
      </div>
    ),
  }
);

export default function PeopleScreen() {
  return (
    <PhoneShell nav="people">
      <Suspense fallback={null}>
        <AddContactAutoOpen />
      </Suspense>
      <div className="screen screen-has-nav px-5 pt-5">
        <AppHeader />
        <PeopleList />
      </div>
    </PhoneShell>
  );
}
