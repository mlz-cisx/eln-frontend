import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@joeseln/forms';
import { IconsModule } from '@joeseln/icons';
import { ModalsModule } from '@joeseln/modals';
import { TableModule } from '@joeseln/table';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { DetailsDropdownComponent } from './components/details-dropdown/details-dropdown.component';
import { DuplicateDMPModalComponent } from './components/modals/duplicate-dmp/duplicate.component';
import { DuplicateProjectModalComponent } from './components/modals/duplicate-project/duplicate.component';
import { PrivilegesModalComponent } from './components/modals/privileges/privileges.component';
import { ShareModalComponent } from './components/modals/share/share.component';
import { LoadingModule } from '../loading/loading.module';

@NgModule({
  declarations: [
    DetailsDropdownComponent,
    PrivilegesModalComponent,
    ShareModalComponent,
    DuplicateProjectModalComponent,
    DuplicateDMPModalComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    ModalsModule,
    TableModule,
    TranslocoRootModule,
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    FormsModule,
    LoadingModule,
    TooltipModule.forRoot(),
    IconsModule,
  ],
  exports: [
    DetailsDropdownComponent,
    PrivilegesModalComponent,
    ShareModalComponent,
    DuplicateProjectModalComponent,
    DuplicateDMPModalComponent,
  ],
})
export class DetailsDropdownModule {}
