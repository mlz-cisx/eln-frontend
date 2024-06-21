export interface TimeGroup {
  time: number | null;
  unit: 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | null;
}
