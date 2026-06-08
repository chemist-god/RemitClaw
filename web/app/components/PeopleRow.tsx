"use client";

import Link from "next/link";
import type { Person } from "../data/people";
import { payLink } from "../data/people";
import { useLanguage } from "../context/LanguageContext";
import { Avatar } from "./Avatar";
import { ChevronDownIcon } from "./icons";

export function PeopleRow({
  people,
  title,
  showMore = true,
  priority = false,
}: {
  people: Person[];
  title?: string;
  showMore?: boolean;
  priority?: boolean;
}) {
  const { t } = useLanguage();
  const heading = title ?? t("home.people");

  return (
    <section className="mt-7">
      <h2 className="text-[1.05rem] text-ink">{heading}</h2>
      <div className="people-scroll mt-3">
        {people.map((person, index) => (
          <Link
            key={person.id}
            href={payLink(person.name)}
            className="people-item"
          >
            <Avatar
              name={person.name}
              src={person.avatar}
              priority={priority && index === 0}
            />
            <span className="people-name">{person.name}</span>
          </Link>
        ))}
        {showMore && (
          <Link href="/people" className="people-item">
            <span className="people-more">
              <ChevronDownIcon className="h-5 w-5 -rotate-90" />
            </span>
            <span className="people-name">{t("common.more")}</span>
          </Link>
        )}
      </div>
    </section>
  );
}
