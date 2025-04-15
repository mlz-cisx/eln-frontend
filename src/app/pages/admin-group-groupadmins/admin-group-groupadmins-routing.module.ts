import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuard} from "@app/services";
import {
  GroupGroupadminsComponent
} from "@app/pages/admin-group-groupadmins/components/admin-group-groupadmins/group-groupadmins.component";


const routes: Routes = [
  {
    path: '',
    component: GroupGroupadminsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':id',
    component: GroupGroupadminsComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminGroupGroupadminsRoutingModule {
}
