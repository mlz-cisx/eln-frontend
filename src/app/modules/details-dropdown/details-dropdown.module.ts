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
import { LoadingModule } from '../loading/loading.module';

@NgModule({
  declarations: [
    DetailsDropdownComponent,
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
  ],
})
export class DetailsDropdownModule {}
