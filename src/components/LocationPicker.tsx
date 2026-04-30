// src/components/LocationPicker.tsx
// Shared cascading location picker — Country → Province/State → City → Neighbourhood
// Pakistan: full dropdown cascade
// International: Country → free text state → free text city → free text neighbourhood

import { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import {
  COUNTRIES, PK_PROVINCES, getProvincesForCountry,
  getCitiesForProvince, isPakistan,
} from '@/data/locations';

export interface LocationValue {
  country: string;       // country name
  countryCode: string;   // ISO code e.g. 'PK'
  province: string;      // province/state name
  city: string;          // city name
  neighbourhood: string; // neighbourhood (always free text)
}

interface LocationPickerProps {
  value: Partial<LocationValue>;
  onChange: (value: LocationValue) => void;
  required?: boolean;
  disabled?: boolean;
}

// ─── Reusable select wrapper ──────────────────────────────────────────────────

function PickerSelect({
  label, value, onChange, options, placeholder, disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-enb-text-secondary uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled || options.length === 0}
          className={`w-full appearance-none text-sm px-3 py-2.5 pr-8 rounded-xl border
            outline-none transition-all bg-white
            ${disabled || options.length === 0
              ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
              : value
                ? 'border-enb-green/50 text-enb-text-primary'
                : 'border-gray-200 text-enb-text-secondary'
            }
            focus:border-enb-green focus:ring-1 focus:ring-enb-green/20`}
        >
          <option value="">{placeholder}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none
          ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
      </div>
    </div>
  );
}

function PickerInput({
  label, value, onChange, placeholder, disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-enb-text-secondary uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full text-sm px-3 py-2.5 rounded-xl border outline-none transition-all
          ${disabled
            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
            : value
              ? 'border-enb-green/50 text-enb-text-primary'
              : 'border-gray-200 text-enb-text-secondary placeholder:text-gray-400'
          }
          focus:border-enb-green focus:ring-1 focus:ring-enb-green/20`}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LocationPicker({
  value, onChange, required = false, disabled = false,
}: LocationPickerProps) {
  const [countryCode, setCountryCode] = useState(value.countryCode || '');
  const [province, setProvince]       = useState(value.province || '');
  const [city, setCity]               = useState(value.city || '');
  const [neighbourhood, setNeighbourhood] = useState(value.neighbourhood || '');

  // Derived
  const isPK = isPakistan(countryCode);
  const selectedCountry = COUNTRIES.find(c => c.code === countryCode);
  const provinces = getProvincesForCountry(countryCode);
  const cities = isPK ? getCitiesForProvince(province) : [];

  // Reset downstream when upstream changes
  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setProvince('');
    setCity('');
    setNeighbourhood('');
  };
  const handleProvinceChange = (p: string) => {
    setProvince(p);
    setCity('');
    setNeighbourhood('');
  };
  const handleCityChange = (c: string) => {
    setCity(c);
    setNeighbourhood('');
  };

  // Bubble changes up to parent
  useEffect(() => {
    onChange({
      country:      selectedCountry?.name || '',
      countryCode,
      province,
      city,
      neighbourhood,
    });
  }, [countryCode, province, city, neighbourhood]);

  const countryOptions = COUNTRIES.map(c => ({ value: c.code, label: c.name }));
  const provinceOptions = provinces.map(p => ({ value: p.code, label: p.name }));
  const cityOptions = cities.map(c => ({ value: c.name, label: c.name }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-enb-green" />
        <span className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider">
          Location{required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
      </div>

      {/* Country */}
      <PickerSelect
        label="Country"
        value={countryCode}
        onChange={handleCountryChange}
        options={countryOptions}
        placeholder="Select country"
        disabled={disabled}
      />

      {/* Province / State */}
      {countryCode && (
        isPK ? (
          <PickerSelect
            label="Province / Territory"
            value={province}
            onChange={handleProvinceChange}
            options={provinceOptions}
            placeholder={countryCode ? 'Select province' : 'Select country first'}
            disabled={disabled || !countryCode}
          />
        ) : (
          <PickerInput
            label="State / Region"
            value={province}
            onChange={handleProvinceChange}
            placeholder="e.g. California, Ontario, Bavaria"
            disabled={disabled || !countryCode}
          />
        )
      )}

      {/* City */}
      {(countryCode && (isPK ? province : true)) && (
        isPK ? (
          <PickerSelect
            label="City"
            value={city}
            onChange={handleCityChange}
            options={cityOptions}
            placeholder={province ? 'Select city' : 'Select province first'}
            disabled={disabled || !province}
          />
        ) : (
          <PickerInput
            label="City"
            value={city}
            onChange={handleCityChange}
            placeholder="e.g. London, Toronto, Munich"
            disabled={disabled || !countryCode}
          />
        )
      )}

      {/* Neighbourhood — always free text */}
      {(isPK ? city : city || province) && (
        <PickerInput
          label="Neighbourhood / Area"
          value={neighbourhood}
          onChange={setNeighbourhood}
          placeholder="e.g. Chaklala Scheme 3, DHA Phase 2"
          disabled={disabled}
        />
      )}

      {/* Progress indicator */}
      {countryCode && (
        <div className="flex items-center gap-1.5 pt-0.5">
          {[
            { done: !!countryCode, label: 'Country' },
            { done: !!province,    label: isPK ? 'Province' : 'State' },
            { done: !!city,        label: 'City' },
            { done: !!neighbourhood, label: 'Area' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <div className="w-3 h-px bg-gray-200" />}
              <div className={`w-1.5 h-1.5 rounded-full transition-colors
                ${step.done ? 'bg-enb-green' : 'bg-gray-200'}`} />
            </div>
          ))}
          <span className="text-[10px] text-enb-text-muted ml-1">
            {[countryCode && selectedCountry?.name, province, city, neighbourhood]
              .filter(Boolean).join(' › ')}
          </span>
        </div>
      )}
    </div>
  );
}
