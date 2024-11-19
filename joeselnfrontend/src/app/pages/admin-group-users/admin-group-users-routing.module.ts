/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {AuthGuardService} from "@app/services";
import {
  GroupUsersComponent
} from "@app/pages/admin-group-users/components/admin-group-users/group-users.component";


const routes: Routes = [
  {
    path: '',
    component: GroupUsersComponent,
    canActivate: [AuthGuardService],
  },
    {
    path: ':id',
    component: GroupUsersComponent,
    canActivate: [AuthGuardService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminGroupUsersRoutingModule {
}
