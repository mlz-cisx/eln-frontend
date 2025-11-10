import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MolViewerComponent} from "./component/mol-viewer.component";


@NgModule({
  declarations: [],
  imports: [CommonModule, MolViewerComponent],
  exports: [MolViewerComponent]
})
export class MolViewerModule {
}