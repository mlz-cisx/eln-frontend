import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {
  LandingPageComponent
} from "@app/pages/landing-page/landing-page/landing-page.component";
import {AuthGuard} from "@app/services";

const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    canActivate: [AuthGuard],
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class LandingPageRoutingModule {
}
