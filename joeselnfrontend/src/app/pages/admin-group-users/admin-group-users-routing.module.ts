import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuard} from "@app/services";
import {
  GroupUsersComponent
} from "@app/pages/admin-group-users/components/admin-group-users/group-users.component";


const routes: Routes = [
  {
    path: '',
    component: GroupUsersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':id',
    component: GroupUsersComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminGroupUsersRoutingModule {
}
