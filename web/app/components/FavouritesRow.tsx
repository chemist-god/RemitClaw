"use client";

import Link from "next/link";
import type { Person } from "../data/people";
import { payLink } from "../data/people";
import { Avatar } from "./Avatar";
import { AddContactButton } from "./AddContactButton";

export function FavouritesRow({ favourites }: { favourites: Person[] }) {
  return (
    <section className="relative z-[1] mt-6">
      <h2 className="text-[1.05rem] text-ink">Favourite</h2>
      <div className="people-scroll mt-3">
        <AddContactButton />
        {favourites.map((person) => (
          <Link key={person.id} href={payLink(person.name)} className="people-item">
            <Avatar name={person.name} src={person.avatar} />
            <span className="people-name">{person.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
