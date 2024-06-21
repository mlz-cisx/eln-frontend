/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {
  LabBookPageComponent
} from './components/labbook-page/labbook-page.component';
import {
  LabBooksPageComponent
} from './components/labbooks-page/labbooks-page.component';
import {AuthGuardService} from "@app/services";

const routes: Routes = [
  {
    path: '',
    component: LabBooksPageComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: ':id',
    component: LabBookPageComponent,
    canActivate: [AuthGuardService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LabBooksPageRoutingModule {
}
