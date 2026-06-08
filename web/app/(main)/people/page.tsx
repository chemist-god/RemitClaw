import { PeopleScreenContent } from "../../components/PeopleScreenContent";
import { PhoneShell } from "../../components/PhoneShell";

export default function PeopleScreen() {
  return (
    <PhoneShell nav="people">
      <PeopleScreenContent />
    </PhoneShell>
  );
}
