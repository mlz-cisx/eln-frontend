/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {NotePageComponent} from './components/note-page/note-page.component';
import {NotesPageComponent} from './components/notes-page/notes-page.component';
import {AuthGuardService} from "@app/services";

const routes: Routes = [
  {
    path: '',
    component: NotesPageComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: ':id',
    component: NotePageComponent,
    canActivate: [AuthGuardService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotesPageRoutingModule {
}
