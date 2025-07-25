import type { TableColumn } from './table-column.interface';

export type TableColumnChangedEvent = Omit<TableColumn, 'cellTemplate'>[];
