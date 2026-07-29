"use client";

type RomPickerProps = {
  disabled: boolean;
  onSelect: (file: File) => void;
};

export function RomPicker({ disabled, onSelect }: RomPickerProps) {
  return (
    <label className={`rom-picker ${disabled ? "is-disabled" : ""}`}>
      <span>Choose a ROM</span>
      <input
        type="file"
        accept=".sfc,.smc,application/octet-stream"
        disabled={disabled}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) onSelect(file);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}
