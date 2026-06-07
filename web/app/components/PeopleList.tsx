"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AddContactButton } from "./AddContactButton";
import { Avatar } from "./Avatar";
import { SearchIcon } from "./icons";
import { payLink } from "../data/people";
import { useContacts } from "../context/ContactsContext";

export function PeopleList() {
  const { allPeople, favourites } = useContacts();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPeople;
    return allPeople.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country?.toLowerCase().includes(q)
    );
  }, [allPeople, query]);

  return (
    <>
      <section className="mt-6">
        <h1 className="text-[1.6rem] leading-tight text-ink">People</h1>
        <p className="mt-1 text-sm text-muted">
          Send to your contacts across corridors
        </p>
      </section>

      <div className="search-field mt-5">
        <SearchIcon className="h-[1.1rem] w-[1.1rem] shrink-0 text-soft" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts"
          className="min-w-0 flex-1 bg-transparent text-[0.9rem] text-ink outline-none placeholder:text-soft"
        />
      </div>

      <section className="relative z-[1] mt-7">
        <h2 className="text-[1.05rem] text-ink">Favourite</h2>
        <div className="people-scroll mt-3">
          <AddContactButton />
          {favourites.map((person) => (
            <Link key={person.id} href={payLink(person.name)} className="people-item">
              <Avatar name={person.name} src={person.avatar} ring />
              <span className="people-name">{person.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-[1.05rem] text-ink">All contacts</h2>
        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No contacts match your search.</p>
        ) : (
          <div className="people-grid mt-4">
            {filtered.map((person) => (
              <Link key={person.id} href={payLink(person.name)} className="people-grid-item">
                <Avatar name={person.name} src={person.avatar} ring />
                <span className="people-name">{person.name}</span>
                {person.country && (
                  <span className="text-[0.65rem] font-semibold uppercase text-soft">
                    {person.country}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
