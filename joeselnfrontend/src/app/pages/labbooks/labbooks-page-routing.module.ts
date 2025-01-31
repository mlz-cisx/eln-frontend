import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {
  LabBookPageComponent
} from './components/labbook-page/labbook-page.component';
import {
  LabBooksPageComponent
} from './components/labbooks-page/labbooks-page.component';
import {AuthGuard} from "@app/services";

const routes: Routes = [
  {
    path: '',
    component: LabBooksPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':id',
    component: LabBookPageComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LabBooksPageRoutingModule {
}
