import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  LandingPageComponent
} from "@app/pages/landing-page/landing-page/landing-page.component";
import {
  LandingPageRoutingModule
} from "@app/pages/landing-page/landing-page-routing.module";
import {ReactiveFormsModule} from "@angular/forms";
import {FormsModule} from "@joeseln/forms";


@NgModule({
  declarations: [
    LandingPageComponent
  ],
  imports: [
    CommonModule,
    LandingPageRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class LandingPageModule {
}
