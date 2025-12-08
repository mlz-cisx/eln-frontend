import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MolViewerComponent} from "./component/mol-viewer.component";
import { TranslocoRootModule } from '@app/transloco-root.module';


@NgModule({
  declarations: [MolViewerComponent],
  imports: [CommonModule, TranslocoRootModule],
  exports: [MolViewerComponent]
})
export class MolViewerModule {
}