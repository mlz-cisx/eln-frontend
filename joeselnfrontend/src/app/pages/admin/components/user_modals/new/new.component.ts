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
import {UntypedFormGroup, Validators, UntypedFormBuilder,} from '@angular/forms';
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
  User
} from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {from, of, Subject} from 'rxjs';
import {catchError, debounceTime, mergeMap, switchMap} from 'rxjs/operators';



@UntilDestroy()
@Component({
  selector: 'eworkbench-new-user-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewUserModalComponent implements OnInit {
  public initialState?: User = this.modalRef.data?.initialState;

  public loading = false;

  public state = ModalState.Unchanged;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public form = this.fb.group({

      username: [null, [Validators.required]],
      first_name: [null, [Validators.required]],
      last_name: [null, [Validators.required]],
      email: [null, [Validators.required, Validators.pattern('[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}')]],
      password: [null, [Validators.required, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s])\\S{8,16}')]],
      password_confirmed: [null, [Validators.required, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s])\\S{8,16}')]],
    },
    {validators: [this.MustMatch('password', 'password_confirmed')]}
  );

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly notesService: NotesService,
    private readonly fb: UntypedFormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    public readonly admin_users_service: AdminUsersService
    //private readonly projectsService: ProjectsService
  ) {
  }

  private get f(): UntypedFormGroup['controls'] {
    return this.form.controls;
  }

  private get user(): UserPayload {
    return {
      username: this.f['username'].value!,
      first_name: this.f['first_name'].value!,
      last_name: this.f['last_name'].value!,
      email: this.f['email'].value!,
      password: this.f['password'].value!,
      password_confirmed: this.f['password_confirmed'].value!,
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

          username: this.initialState.username,
          first_name: this.initialState.first_name,
          last_name: this.initialState.last_name,
          email: this.initialState.email,

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

    this.admin_users_service
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
    return (formGroup: UntypedFormGroup) => {
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
