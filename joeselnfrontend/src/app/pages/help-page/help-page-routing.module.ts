import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {
  HelpPageComponent
} from "@app/pages/help-page/help-page/help-page.component";
import {AuthGuardService} from "@app/services";

const routes: Routes = [
  {
    path: '',
    component: HelpPageComponent,
    canActivate: [AuthGuardService],
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class HelpPageRoutingModule {
}
