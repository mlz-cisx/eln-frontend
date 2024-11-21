/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {HttpParams} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import {FormGroup, Validators, FormBuilder,} from '@angular/forms';
import {ModalState} from '@app/enums/modal-state.enum';
import {
  AdminUsersService,
  NotesService,
  // ProjectsService
} from '@app/services';
import type {
  Note,
  NotePayload,
  Project,
  UserPayload,
  User, GroupPayload,
  Group
} from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {from, of, Subject} from 'rxjs';
import {catchError, debounceTime, mergeMap, switchMap} from 'rxjs/operators';
import {
  AdminGroupsService
} from "@app/services/admin_users/admin-groups.service";



@UntilDestroy()
@Component({
  selector: 'eworkbench-new-group-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewGroupModalComponent implements OnInit {
  public initialState?: Group = this.modalRef.data?.initialState;

  public loading = false;

  public state = ModalState.Unchanged;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public form = this.fb.group({
      groupname: [null, [Validators.required]],
    },

  );

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly notesService: NotesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    public readonly admin_groups_service: AdminGroupsService
    //private readonly projectsService: ProjectsService
  ) {
  }

  private get f(): FormGroup['controls'] {
    return this.form.controls;
  }

  private get user(): GroupPayload {
    return {
      groupname: this.f['groupname'].value!,
    };
  }

  public ngOnInit(): void {
    this.initSearchInput();
    this.patchFormValues();
  }

  public initSearchInput(): void {

    // this.projectInput$
    //   .pipe(
    //     untilDestroyed(this),
    //     debounceTime(500),
    //     switchMap(input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
    //   )
    //   .subscribe(projects => {
    //     this.projects = [...projects].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
    //     this.cdr.markForCheck();
    //   });
    //
    // this.projectsService
    //   .getList(new HttpParams().set('favourite', 'true'))
    //   .pipe(untilDestroyed(this))
    //   .subscribe(projects => {
    //     if (projects.data.length) {
    //       this.favoriteProjects = [...projects.data];
    //       this.projects = [...this.projects, ...this.favoriteProjects]
    //         .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
    //         .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
    //       this.cdr.markForCheck();
    //     }
    //   });

  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue(
        {
          groupname: this.initialState.groupname,
        },
        {emitEvent: false}
      );

      // if (this.initialState.projects.length) {

      // from(this.initialState.projects)
      //   .pipe(
      //     untilDestroyed(this),
      //     mergeMap(id =>
      //       this.projectsService.get(id).pipe(
      //         untilDestroyed(this),
      //         catchError(() =>
      //           of({ pk: id, name: this.translocoService.translate('formInput.unknownProject'), is_favourite: false } as Project)
      //         )
      //       )
      //     )
      //   )
      //   .subscribe(project => {
      //     this.projects = [...this.projects, project]
      //       .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
      //       .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
      //     this.cdr.markForCheck();
      //   });
      // }
    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.admin_groups_service
      .add(this.user)
      .pipe(untilDestroyed(this))
      .subscribe(
        user => {
          this.state = ModalState.Changed;
          this.modalRef.close({
            state: this.state,
            data: {newContent: user},
            navigate: ['/admin/users',]
          });
          this.translocoService
            .selectTranslate('note.newModal.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
          location.reload()
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  MustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];


      if (matchingControl.errors && !matchingControl.errors['mustmatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({mustmatch: true});
        return;
      }

      matchingControl.setErrors(null);
    };
  }
}
