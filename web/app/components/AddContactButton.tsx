"use client";

import { useAddContact } from "../context/AddContactContext";
import { PlusIcon } from "./icons";

export function AddContactButton() {
  const { openAddContact } = useAddContact();

  const open = () => {
    openAddContact();
  };

  return (
    <button
      type="button"
      className="people-item people-item-btn"
      aria-label="Add contact"
      onTouchStart={open}
      onClick={open}
    >
      <span className="people-more people-more-add">
        <PlusIcon className="h-5 w-5" />
      </span>
      <span className="people-name">Add</span>
    </button>
  );
}
