
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@joeseln/forms';
import { IconsModule } from '@joeseln/icons';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { LoadingComponent } from './components/loading/loading.component';
import { TableColumnComponent } from './components/table-columns/table-columns.component';
import { TableSortComponent } from './components/table-sort/table-sort.component';
import { TableViewComponent } from './components/table-view/table-view.component';
import { TreeViewComponent } from './components/tree-view/tree-view.component';


@NgModule({
  declarations: [
    LoadingComponent,
    TableColumnComponent,
    TableSortComponent,
    TableViewComponent,
    TreeViewComponent
  ],
  imports: [CommonModule, CdkTableModule, DragDropModule, IconsModule, FormsModule, BsDropdownModule.forRoot(), TooltipModule.forRoot()],
  exports: [TableColumnComponent, TableColumnComponent, TreeViewComponent, TableViewComponent],
})
export class TableModule {}
