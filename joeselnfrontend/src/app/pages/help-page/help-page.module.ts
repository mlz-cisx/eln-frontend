import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  HelpPageComponent
} from "@app/pages/help-page/help-page/help-page.component";
import {
  HelpPageRoutingModule
} from "@app/pages/help-page/help-page-routing.module";
import {ReactiveFormsModule} from "@angular/forms";
import {FormsModule} from "@joeseln/forms";


@NgModule({
  declarations: [
    HelpPageComponent
  ],
  imports: [
    CommonModule,
    HelpPageRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class HelpPageModule {
}
