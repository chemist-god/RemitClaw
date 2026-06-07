"use client";

import { useContacts } from "../context/ContactsContext";
import { FavouritesRow } from "./FavouritesRow";
import { PeopleRow } from "./PeopleRow";

export function HomeContacts() {
  const { allPeople, favourites } = useContacts();

  return (
    <>
      <PeopleRow people={allPeople.slice(0, 4)} />
      <FavouritesRow favourites={favourites} />
    </>
  );
}
