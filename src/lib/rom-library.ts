export type RomLibraryEntry = {
  name: string;
  size: number;
};

export type RomLibraryResponse = {
  enabled: boolean;
  roms: RomLibraryEntry[];
  message?: string;
};
