import { Select } from '../ui/Select';

export interface SortOption {
  value: string;
  label: string;
}

export function SortSelect({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
}) {
  return (
    <Select
      aria-label="Sort results"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      className="h-10 w-auto min-w-48"
    />
  );
}