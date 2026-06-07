"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FAVOURITES, PEOPLE, toyAvatar, type Person } from "../data/people";

const STORAGE_KEY = "remitclaw-added-contacts";

type AddPersonInput = {
  name: string;
  country?: string;
  phone?: string;
  favourite?: boolean;
};

type ContactsContextValue = {
  allPeople: Person[];
  favourites: Person[];
  addPerson: (input: AddPersonInput) => Person;
  findPerson: (name: string) => Person | undefined;
};

const ContactsContext = createContext<ContactsContextValue | null>(null);

function loadAdded(): Person[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Person[]) : [];
  } catch {
    return [];
  }
}

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [added, setAdded] = useState<Person[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAdded(loadAdded());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(added));
    }
  }, [added, ready]);

  const allPeople = useMemo(() => {
    const ids = new Set(PEOPLE.map((p) => p.id));
    return [...PEOPLE, ...added.filter((p) => !ids.has(p.id))];
  }, [added]);

  const favourites = useMemo(() => {
    const ids = new Set(FAVOURITES.map((p) => p.id));
    const addedFavs = added.filter((p) => p.favourite);
    return [...FAVOURITES, ...addedFavs.filter((p) => !ids.has(p.id))];
  }, [added]);

  const addPerson = useCallback((input: AddPersonInput) => {
    const name = input.name.trim();
    const person: Person = {
      id: `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      name,
      avatar: toyAvatar(name),
      country: input.country,
      phone: input.phone,
      favourite: input.favourite,
    };
    setAdded((prev) => [...prev, person]);
    return person;
  }, []);

  const findPerson = useCallback(
    (name: string) => {
      const all = [...allPeople, ...favourites];
      return all.find((p) => p.name.toLowerCase() === name.toLowerCase());
    },
    [allPeople, favourites]
  );

  const value = useMemo(
    () => ({ allPeople, favourites, addPerson, findPerson }),
    [allPeople, favourites, addPerson, findPerson]
  );

  return (
    <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>
  );
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) {
    throw new Error("useContacts must be used within ContactsProvider");
  }
  return ctx;
}
