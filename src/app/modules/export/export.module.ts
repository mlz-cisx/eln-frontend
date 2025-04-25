import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { ExportComponent } from './export.component';

@NgModule({
  declarations: [ExportComponent],
  imports: [CommonModule, RouterModule],
  exports: [ExportComponent],
})
export class ExportModule {}
