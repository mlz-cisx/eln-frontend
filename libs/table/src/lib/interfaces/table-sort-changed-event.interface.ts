import type { TableSortDirection } from '../enums/table-sort-direction.enum';

export interface TableSortChangedEvent {
  key: string;
  direction: TableSortDirection;
}
