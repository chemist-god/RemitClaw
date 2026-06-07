import Link from "next/link";
import type { Person } from "../data/people";
import { payLink } from "../data/people";
import { Avatar } from "./Avatar";
import { ChevronDownIcon } from "./icons";

export function PeopleRow({
  people,
  title = "People",
  showMore = true,
}: {
  people: Person[];
  title?: string;
  showMore?: boolean;
}) {
  return (
    <section className="mt-7">
      <h2 className="text-[1.05rem] text-ink">{title}</h2>
      <div className="people-scroll mt-3">
        {people.map((person) => (
          <Link
            key={person.id}
            href={payLink(person.name)}
            className="people-item"
          >
            <Avatar name={person.name} src={person.avatar} />
            <span className="people-name">{person.name}</span>
          </Link>
        ))}
        {showMore && (
          <Link href="/people" className="people-item">
            <span className="people-more">
              <ChevronDownIcon className="h-5 w-5 -rotate-90" />
            </span>
            <span className="people-name">More</span>
          </Link>
        )}
      </div>
    </section>
  );
}
