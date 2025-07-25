import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@joeseln/forms';
import { IconsModule } from '@joeseln/icons';
import { ModalsModule } from '@joeseln/modals';
import { TableModule } from '@joeseln/table';
import { AlertModule } from 'ngx-bootstrap/alert';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { DeleteModalComponent } from './components/modals/delete/delete.component';
import { TrashNoticeComponent } from './components/notice/notice.component';
import { RestoreButtonComponent } from './components/restore-button/restore-button.component';
import { TrashButtonComponent } from './components/trash-button/trash-button.component';
import { LoadingModule } from '../loading/loading.module';

@NgModule({
  declarations: [TrashButtonComponent, RestoreButtonComponent, DeleteModalComponent, TrashNoticeComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ModalsModule,
    TableModule,
    TranslocoRootModule,
    LoadingModule,
    AlertModule.forRoot(),
    IconsModule,
    TooltipModule.forRoot(),
  ],
  exports: [TrashButtonComponent, RestoreButtonComponent, DeleteModalComponent, TrashNoticeComponent],
})
export class TrashModule {}
