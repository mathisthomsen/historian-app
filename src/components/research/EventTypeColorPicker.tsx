"use client";

const PALETTE = [
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#ca8a04",
  "#16a34a",
  "#0d9488",
  "#0891b2",
  "#2563eb",
  "#4338ca",
  "#7c3aed",
  "#db2777",
  "#4b5563",
];

interface EventTypeColorPickerProps {
  value: string | null;
  onChange: (hex: string) => void;
}

export function EventTypeColorPicker({ value, onChange }: EventTypeColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((hex) => (
        <button
          key={hex}
          type="button"
          aria-label={hex}
          aria-pressed={value === hex}
          onClick={() => onChange(hex)}
          className="h-6 w-6 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          style={{
            backgroundColor: hex,
            boxShadow: value === hex ? `0 0 0 2px white, 0 0 0 4px ${hex}` : undefined,
          }}
        />
      ))}
    </div>
  );
}
