import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {
  HSDSViewerComponent
} from "@app/pages/hsds/component/hsds-viewer.component";
import {AuthGuard} from "@app/services";

const routes: Routes = [
  {
    path: '',
    component: HSDSViewerComponent,
    canActivate: [AuthGuard],
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class HsdsPageRoutingModule {
}
