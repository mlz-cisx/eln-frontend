import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { IconsModule } from '@joeseln/icons';
import { ModalsModule } from '@joeseln/modals';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    UserDetailsComponent,
  ],
  imports: [
    CommonModule,
    ModalsModule,
    TranslocoRootModule,
    RouterModule,
    IconsModule,
    PopoverModule,
    SharedModule,
  ],
  exports: [
    UserDetailsComponent,
  ],
})
export class UserModule {}
