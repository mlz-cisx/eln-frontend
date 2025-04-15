import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AdminPageComponent} from './components/admin-page/admin-page.component';
import {
  ElnadminsPageComponent
} from './components/admin-admins/elnadmins-page.component';
import {AuthGuard} from "@app/services";
import {
  UsersPageComponent
} from './components/admin-users/users-page.component';
import {
  UserPageComponent
} from './components/admin-user/user-page.component';
import {
  GroupsPageComponent
} from "@app/pages/admin/components/admin-groups/groups-page.component";


const routes: Routes = [
  {
    path: '',
    component: AdminPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'users',
    component: UsersPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'admins',
    component: ElnadminsPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'groups',
    component: GroupsPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':id',
    component: UserPageComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminPageRoutingModule {
}
