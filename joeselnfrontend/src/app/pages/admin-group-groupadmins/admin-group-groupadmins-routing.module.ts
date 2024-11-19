/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuardService} from "@app/services";
import {
  GroupGroupadminsComponent
} from "@app/pages/admin-group-groupadmins/components/admin-group-groupadmins/group-groupadmins.component";


const routes: Routes = [
  {
    path: '',
    component: GroupGroupadminsComponent,
    canActivate: [AuthGuardService],
  },
    {
    path: ':id',
    component: GroupGroupadminsComponent,
    canActivate: [AuthGuardService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminGroupGroupadminsRoutingModule {
}
