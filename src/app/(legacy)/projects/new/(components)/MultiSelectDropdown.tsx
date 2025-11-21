"use client";

import { useState, useRef, useEffect } from "react";

type Option = {
  value: string;
  label: string;
};

type MultiSelectDropdownProps = {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
};

export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Select options",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="input-brand flex w-full items-center justify-between rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-brand-muted">
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
        </span>
        <svg
          className={`h-4 w-4 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-brand bg-white shadow-lg">
          <ul className="max-h-60 overflow-y-auto p-2">
            {options.map((option) => (
              <li
                key={option.value}
                className="flex cursor-pointer items-center rounded-md p-2 hover:bg-brand-soft"
                onClick={() => toggleOption(option.value)}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  checked={selected.includes(option.value)}
                  readOnly
                />
                <span className="ml-3 text-sm text-brand-strong">{option.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
