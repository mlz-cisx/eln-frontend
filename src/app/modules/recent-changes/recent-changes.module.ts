import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@joeseln/forms';
import { IconsModule } from '@joeseln/icons';
import { ModalsModule } from '@joeseln/modals';
import { TableModule } from '@joeseln/table';
import { RecentChangesComponent } from './components/recent-changes/recent-changes.component';

@NgModule({
  declarations: [
    RecentChangesComponent,
  ],
  imports: [
    CommonModule,
    TranslocoRootModule,
    TableModule,
    TranslocoRootModule,
    UserModule,
    SharedModule,
    IconsModule,
    ModalsModule,
    FormsModule,
    UserModule,
    RouterModule,
  ],
  exports: [
    RecentChangesComponent,
  ],
})
export class RecentChangesModule {}
