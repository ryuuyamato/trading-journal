// Impact colour coding for economic-calendar events, shared by the filter chips
// and the event rows. Token-based so it survives the theme switch — the old
// hardcoded Tailwind palette classes only worked on a light background.
//
// HIGH borrows the loss red and LOW the profit green purely as a severity ramp;
// they say nothing about trade direction.

export const IMPACT_DOT: Record<string, string> = {
  HIGH: "bg-loss",
  MEDIUM: "bg-brand",
  LOW: "bg-profit",
  HOLIDAY: "bg-chart-4",
};

// Row tint: kept very faint so a table of events still reads as one surface.
export const IMPACT_ROW_BG: Record<string, string> = {
  HIGH: "bg-loss/[0.06]",
  MEDIUM: "bg-brand/[0.06]",
  LOW: "",
  HOLIDAY: "bg-chart-4/[0.06]",
};

export const IMPACT_TEXT: Record<string, string> = {
  HIGH: "text-loss",
  MEDIUM: "text-brand-ink",
  LOW: "text-profit",
  HOLIDAY: "text-chart-4",
};
