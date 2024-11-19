/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AdminPageComponent} from './components/admin-page/admin-page.component';
import {
  ElnadminsPageComponent
} from './components/admin-admins/elnadmins-page.component';
import {AuthGuardService} from "@app/services";
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
    canActivate: [AuthGuardService],
  },
  {
    path: 'users',
    component: UsersPageComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'admins',
    component: ElnadminsPageComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'groups',
    component: GroupsPageComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: ':id',
    component: UserPageComponent,
    canActivate: [AuthGuardService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminPageRoutingModule {
}
