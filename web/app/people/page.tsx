import { Suspense } from "react";
import { AddContactAutoOpen } from "../components/AddContactAutoOpen";
import { AppHeader } from "../components/AppHeader";
import { PeopleList } from "../components/PeopleList";
import { PhoneShell } from "../components/PhoneShell";

export default function PeopleScreen() {
  return (
    <PhoneShell nav="people">
      <Suspense>
        <AddContactAutoOpen />
      </Suspense>
      <div className="screen screen-has-nav px-5 pt-5">
        <AppHeader />
        <PeopleList />
      </div>
    </PhoneShell>
  );
}
