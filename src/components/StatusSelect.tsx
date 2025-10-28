import { Listbox } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

interface Option {
  label: string;
  value: string;
}

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  label?: string;
  className?: string;
}

export function StatusSelect({
  value,
  onChange,
  options,
  label,
  className = "",
}: StatusSelectProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <div className={`w-full sm:w-52 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          {/* --- Button (main field) --- */}
          <Listbox.Button
            className="relative w-full h-[42px] rounded-lg border border-gray-300 bg-white/90 
                       backdrop-blur-sm pl-3 pr-10 text-left text-gray-900 
                       shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 
                       text-sm hover:bg-white transition-all"
          >
            <span>{selected?.label || "Select status"}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
            </span>
          </Listbox.Button>

          {/* --- Dropdown options --- */}
          <Listbox.Options
            className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white 
                       py-1 text-base shadow-lg ring-1 ring-black/5 
                       focus:outline-none sm:text-sm z-50"
          >
            {options.map((option) => (
              <Listbox.Option
                key={option.value}
                value={option.value}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 transition 
                   ${
                     active
                       ? "bg-indigo-100 text-indigo-900"
                       : "text-gray-900 hover:bg-gray-50"
                   }`
                }
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? "font-semibold" : "font-normal"
                      }`}
                    >
                      {option.label}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-500">
                        <CheckIcon className="h-5 w-5" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
}
