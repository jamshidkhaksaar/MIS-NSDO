"use client";

import { useMemo } from "react";
import MultiSelectDropdown from "./MultiSelectDropdown";
import type { ProjectProvinceLocations } from "@/lib/project-locations";

const afghanistanProvinces = [
  { value: "Badakhshan", label: "Badakhshan" },
  { value: "Badghis", label: "Badghis" },
  { value: "Baghlan", label: "Baghlan" },
  { value: "Balkh", label: "Balkh" },
  { value: "Bamyan", label: "Bamyan" },
  { value: "Daykundi", label: "Daykundi" },
  { value: "Farah", label: "Farah" },
  { value: "Faryab", label: "Faryab" },
  { value: "Ghazni", label: "Ghazni" },
  { value: "Ghor", label: "Ghor" },
  { value: "Helmand", label: "Helmand" },
  { value: "Herat", label: "Herat" },
  { value: "Jowzjan", label: "Jowzjan" },
  { value: "Kabul", label: "Kabul" },
  { value: "Kandahar", label: "Kandahar" },
  { value: "Kapisa", label: "Kapisa" },
  { value: "Khost", label: "Khost" },
  { value: "Kunar", label: "Kunar" },
  { value: "Kunduz", label: "Kunduz" },
  { value: "Laghman", label: "Laghman" },
  { value: "Logar", label: "Logar" },
  { value: "Maidan Wardak", label: "Maidan Wardak" },
  { value: "Nangarhar", label: "Nangarhar" },
  { value: "Nimruz", label: "Nimruz" },
  { value: "Nuristan", label: "Nuristan" },
  { value: "Paktia", label: "Paktia" },
  { value: "Paktika", label: "Paktika" },
  { value: "Panjshir", label: "Panjshir" },
  { value: "Parwan", label: "Parwan" },
  { value: "Samangan", label: "Samangan" },
  { value: "Sar-e Pol", label: "Sar-e Pol" },
  { value: "Takhar", label: "Takhar" },
  { value: "Uruzgan", label: "Uruzgan" },
  { value: "Zabul", label: "Zabul" },
];

type LocationSelectorProps = {
  value: ProjectProvinceLocations[];
  onChange: (locations: ProjectProvinceLocations[]) => void;
};

const formatList = (items: string[]): string => items.join(", ");

const parseList = (value: string): string[] =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length);

export default function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const selectedProvinces = useMemo(() => value.map((entry) => entry.province), [value]);

  const handleProvinceSelection = (provinces: string[]) => {
    const orderedUnique = Array.from(new Set(provinces));
    const next: ProjectProvinceLocations[] = orderedUnique.map((province) => {
      const existing = value.find((entry) => entry.province === province);
      return (
        existing ?? {
          province,
          districts: [],
          villages: [],
        }
      );
    });
    onChange(next);
  };

  const handleFieldChange = (province: string, field: "districts" | "villages", raw: string) => {
    const tokens = parseList(raw);
    onChange(
      value.map((entry) =>
        entry.province === province
          ? {
              ...entry,
              [field]: tokens,
            }
          : entry
      )
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-brand p-4">
      <div>
        <label className="block text-sm font-medium text-brand-muted">Provinces</label>
        <MultiSelectDropdown
          options={afghanistanProvinces}
          selected={selectedProvinces}
          onChange={handleProvinceSelection}
          placeholder="Select provinces"
        />
      </div>
      {!selectedProvinces.length ? (
        <p className="rounded-lg border border-dashed border-brand px-4 py-6 text-sm text-brand-soft">
          Select at least one province to specify the districts and villages covered.
        </p>
      ) : (
        <div className="space-y-6">
          {value.map((entry) => (
            <div key={entry.province} className="rounded-xl border border-brand bg-white/80 px-4 py-4">
              <p className="text-sm font-semibold text-brand-strong">{entry.province}</p>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    Districts in {entry.province}
                  </label>
                  <textarea
                    value={formatList(entry.districts)}
                    onChange={(event) =>
                      handleFieldChange(entry.province, "districts", event.target.value)
                    }
                    rows={2}
                    className="input-brand mt-1 block w-full rounded-lg"
                    placeholder="e.g. Khas Kunar, Sarkani"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    Villages in {entry.province}
                  </label>
                  <textarea
                    value={formatList(entry.villages)}
                    onChange={(event) =>
                      handleFieldChange(entry.province, "villages", event.target.value)
                    }
                    rows={2}
                    className="input-brand mt-1 block w-full rounded-lg"
                    placeholder="e.g. Qala-e-Naw, Surkhrod"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
