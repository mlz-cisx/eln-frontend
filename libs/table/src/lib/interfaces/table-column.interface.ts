

import type { TemplateRef } from '@angular/core';
import type { TableSortDirection } from '../enums/table-sort-direction.enum';

export interface TableColumn {
  cellTemplate?: TemplateRef<any>;
  name: string;
  key: string;
  sortable?: boolean;
  sort?: TableSortDirection;
  hideable?: boolean;
  hidden?: boolean;
  width?: string;
}
