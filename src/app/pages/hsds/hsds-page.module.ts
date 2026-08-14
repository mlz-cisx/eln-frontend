import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  HSDSViewerComponent
} from "@app/pages/hsds/component/hsds-viewer.component";
import {
  HsdsPageRoutingModule
} from "@app/pages/hsds/hsds-page-routing.module";
import {ReactiveFormsModule} from "@angular/forms";
import {FormsModule} from "@joeseln/forms";


@NgModule({
  declarations: [
    HSDSViewerComponent
  ],
  imports: [
    CommonModule,
    HsdsPageRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class HsdsPageModule {
}
