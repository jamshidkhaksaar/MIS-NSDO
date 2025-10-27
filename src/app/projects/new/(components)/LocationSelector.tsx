"use client";

import { useState } from "react";
import MultiSelectDropdown from "./MultiSelectDropdown";

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

export default function LocationSelector() {
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string>("");
  const [villages, setVillages] = useState<string>("");

  return (
    <div className="space-y-4 rounded-lg border border-brand p-4">
      <div>
        <label className="block text-sm font-medium text-brand-muted">Provinces</label>
        <MultiSelectDropdown
          options={afghanistanProvinces}
          selected={selectedProvinces}
          onChange={setSelectedProvinces}
          placeholder="Select provinces"
        />
      </div>
      <div>
        <label htmlFor="districts" className="block text-sm font-medium text-brand-muted">
          Districts
        </label>
        <input
          type="text"
          id="districts"
          value={districts}
          onChange={(e) => setDistricts(e.target.value)}
          className="input-brand mt-1 block w-full rounded-lg"
          placeholder="Enter district names, separated by commas"
        />
        <p className="mt-1 text-xs text-brand-soft">
          You can tag a district to a province like this: `DistrictName (ProvinceName)`.
        </p>
      </div>
      <div>
        <label htmlFor="villages" className="block text-sm font-medium text-brand-muted">
          Villages
        </label>
        <input
          type="text"
          id="villages"
          value={villages}
          onChange={(e) => setVillages(e.target.value)}
          className="input-brand mt-1 block w-full rounded-lg"
          placeholder="Enter village names, separated by commas"
        />
        <p className="mt-1 text-xs text-brand-soft">
          You can tag a village to a district like this: `VillageName (DistrictName)`.
        </p>
      </div>
    </div>
  );
}
