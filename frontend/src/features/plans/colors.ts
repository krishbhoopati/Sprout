// Stable color assignment per crop so the grid legend and cells always match.
const PALETTE = [
  "#548f28",
  "#e07a5f",
  "#3d81b8",
  "#e6a817",
  "#8e5cd9",
  "#2fb39b",
  "#d1495b",
  "#7a9e3a",
  "#c06c3a",
  "#4f6d7a",
];

export function colorForCrop(cropId: string): string {
  let hash = 0;
  for (let i = 0; i < cropId.length; i++) {
    hash = (hash * 31 + cropId.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
