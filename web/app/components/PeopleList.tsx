"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AddContactButton } from "./AddContactButton";
import { Avatar } from "./Avatar";
import { ImportPhoneContactsButton } from "./ImportPhoneContactsButton";
import { SearchIcon } from "./icons";
import { payLink } from "../data/people";
import { useContacts } from "../context/ContactsContext";
import { useLanguage } from "../context/LanguageContext";

export function PeopleList() {
  const { allPeople, favourites, agentContactCount, syncing } = useContacts();
  const { t } = useLanguage();
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

  const serverHint =
    agentContactCount > 0
      ? ` · ${agentContactCount} ${t("people.onServer")}${syncing ? ` (${t("common.syncing")})` : ""}`
      : "";

  return (
    <>
      <section className="mt-6">
        <h1 className="text-[1.6rem] leading-tight text-ink">{t("people.title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("people.subtitle")}
          {serverHint}
        </p>
      </section>

      <ImportPhoneContactsButton variant="banner" />

      <div className="search-field mt-5">
        <SearchIcon className="h-[1.1rem] w-[1.1rem] shrink-0 text-soft" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("people.search")}
          className="min-w-0 flex-1 bg-transparent text-[0.9rem] text-ink outline-none placeholder:text-soft"
        />
      </div>

      <section className="relative z-[1] mt-7">
        <h2 className="text-[1.05rem] text-ink">{t("people.favourite")}</h2>
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
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[1.05rem] text-ink">{t("people.allContacts")}</h2>
          <ImportPhoneContactsButton variant="chip" />
        </div>
        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t("people.noMatch")}</p>
        ) : (
          <div className="people-grid mt-4">
            {filtered.map((person) => (
              <Link key={person.id} href={payLink(person.name)} className="people-grid-item">
                <Avatar name={person.name} src={person.avatar} ring />
                <span className="people-name">{person.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
