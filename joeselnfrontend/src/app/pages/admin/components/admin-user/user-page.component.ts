/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {HttpErrorResponse, HttpParams} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {Validators} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {ModalState} from '@app/enums/modal-state.enum';
import {
  CommentsComponent
} from '@app/modules/comment/components/comments/comments.component';
import {
  NewCommentModalComponent
} from '@app/modules/comment/components/modals/new/new.component';
// import {PendingChangesModalComponent} from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import {
  AdminUsersService,
  AuthService,
  LabbooksService,
  NotesService, UserService,
  // PageTitleService,
  // ProjectsService,
  WebSocketService
} from '@app/services';
import type {
  Lock,
  Metadata,
  ModalCallback,
  Note,
  NotePayload, PasswordPatchPayload,
  Privileges,
  Project,
  User, UserPatchPayload, UserPayload
} from '@joeseln/types';
import {DialogRef, DialogService} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {from, Observable, of, Subject} from 'rxjs';
import {
  catchError,
  debounceTime,
  map,
  mergeMap,
  skip,
  switchMap,
  take
} from 'rxjs/operators';
import {NewUserModalComponent} from '../user_modals/new/new.component';
import {mockUser} from "@joeseln/mocks";


interface FormUser {
  username: FormControl<string | null>;
  first_name: FormControl<string | null>;
  last_name: FormControl<string | null>;
  user_email: FormControl<string | null>;
}

interface FormPassword {
  password_patch: FormControl<string | null>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-user-page',
  templateUrl: './user-page.component.html',
  styleUrls: ['./user-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public currentUser: User | null = null;

  public initialState?: User;

  public metadata?: Metadata[];

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public modified = false;

  public showSidebar = false;

  public loading = true;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshMetadata = new EventEmitter<boolean>();

  public refreshLinkList = new EventEmitter<boolean>();

  public newModalComponent = NewUserModalComponent;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public user_groups = []
  public admin_groups = []

  public form = this.fb.group<FormUser>({
    username: this.fb.control(null, Validators.required),
    first_name: this.fb.control(null, Validators.required),
    last_name: this.fb.control(null, Validators.required),
    user_email: this.fb.control(null, Validators.required),
  });


  public passwword_form = this.fb.group<FormPassword>({
    password_patch: this.fb.control(null, [Validators.required, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s])\\S{8,16}')]),
  });

  public constructor(
    public readonly notesService: NotesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    // private readonly projectsService: ProjectsService,
    // private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly modalService: DialogService,
    private readonly labbooksService: LabbooksService,
    private user_service: UserService,
    public readonly admin_users_service: AdminUsersService
  ) {
  }

  public get f() {
    return this.form.controls;
  }

  public get pw_f() {
    return this.passwword_form.controls;
  }

  public get lockUser(): { ownUser: boolean; user?: User | undefined | null } {
    if (this.lock) {
      if (this.lock.lock_details?.locked_by.pk === this.currentUser?.pk) {
        return {ownUser: true, user: this.lock.lock_details?.locked_by};
      }

      return {ownUser: false, user: this.lock.lock_details?.locked_by};
    }

    return {ownUser: false, user: null};
  }

  private get user(): UserPatchPayload {
    return {
      username: this.f.username.value!,
      first_name: this.f.first_name.value!,
      last_name: this.f.last_name.value!,
      user_email: this.f.user_email.value!
    };
  }

  private get password(): PasswordPatchPayload {
    return {
      password_patch: this.pw_f.password_patch.value!
    };
  }

  public ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
      // console.log(this.currentUser)
    });

    // this.websocketService.subscribe([{model: 'note', pk: this.id}]);
    // this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
    //   if (data.element_lock_changed?.model_pk === this.id) {
    //     this.lock = data.element_lock_changed;
    //     this.cdr.detectChanges();
    //   }
    //
    //   if (data.element_changed?.model_pk === this.id) {
    //     if (this.lockUser.user && !this.lockUser.ownUser) {
    //       this.modified = true;
    //     } else {
    //       this.modified = false;
    //     }
    //     this.cdr.detectChanges();
    //   }
    // });

    this.initSidebar();
    this.initSearchInput();
    this.initDetails();
    this.initPageTitle();
  }

  public ngOnDestroy(): void {
    // this.websocketService.unsubscribe();
  }

  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        skip(1),
        debounceTime(500),
        switchMap(() => {
          this.cdr.markForCheck();
          // if (!this.lock?.locked) {
          //   return this.notesService.lock(this.id);
          // }

          return of([]);
        })
      )
      .subscribe();
  }

  public initSidebar(): void {

    // this.route.params.subscribe(params => {
    //   if (params.projectId) {
    //     this.showSidebar = true;
    //
    //     this.projectsService.get(params.projectId).subscribe(project => {
    //       this.projects = [...this.projects, project]
    //         .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
    //         .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
    //       this.cdr.markForCheck();
    //     });
    //   }
    // });

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

  public initPageTitle(): void {

    // this.pageTitleService
    //   .get()
    //   .pipe(untilDestroyed(this))
    //   .subscribe(title => {
    //     this.titleService.setTitle(title);
    //   });

  }

  public initDetails(formChanges = true): void {
    // if (!this.currentUser?.pk) {
    //   return;
    // }
    console.log('init Details')

    this.admin_users_service
      .get(this.id)
      .pipe(
        untilDestroyed(this),
        map(privilegesData => {
          const user = privilegesData.data;
          const privileges = privilegesData.privileges;

          console.log(user)
          console.log(privileges)

          this.user_groups = user.groups
          this.admin_groups = user.admin_groups


          this.form.patchValue(
            {
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              user_email: user.email
            },
            {emitEvent: false}
          );

          if (!privileges.edit) {
            this.form.disable({emitEvent: false});
          }

          return privilegesData;
        }),
        switchMap(privilegesData => {

          // if (privilegesData.data.projects.length) {
          //   return from(privilegesData.data.projects).pipe(
          //     mergeMap(id =>
          //       this.projectsService.get(id).pipe(
          //         untilDestroyed(this),
          //         catchError(() =>
          //           of({
          //             pk: id,
          //             name: this.translocoService.translate('formInput.unknownProject'),
          //             is_favourite: false,
          //           } as Project)
          //         )
          //       )
          //     ),
          //     map(project => {
          //       this.projects = [...this.projects, project]
          //         .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
          //         .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          //       this.cdr.markForCheck();
          //     }),
          //     switchMap(() => of(privilegesData))
          //   );
          // }

          return of(privilegesData);
        })
      )
      .subscribe(
        privilegesData => {
          const user = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = user.username;
          // void this.pageTitleService.set(note.display);

          this.initialState = {...user};
          this.privileges = {...privileges};

          this.loading = false;

          if (formChanges) {
            this.initFormChanges();
          }

          this.cdr.markForCheck();
        },
        (error: HttpErrorResponse) => {
          if (error.status === 404) {
            void this.router.navigate(['/not-found']);
          }

          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.admin_users_service
      .patch(this.id, this.user)
      .pipe(untilDestroyed(this))
      .subscribe(
        user => {
          // if (this.lock?.locked && this.lockUser.ownUser) {
          //   this.notesService.unlock(this.id);
          // }

          this.detailsTitle = user.username;
          // void this.pageTitleService.set(note.display);

          this.initialState = {...user};
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshMetadata.next(true);
          this.refreshLinkList.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('user.details.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public password_reset(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.admin_users_service
      .patch_password(this.id, this.password)
      .pipe(untilDestroyed(this))
      .subscribe(
        user => {
          // if (this.lock?.locked && this.lockUser.ownUser) {
          //   this.notesService.unlock(this.id);
          // }

          this.detailsTitle = user.username;
          // void this.pageTitleService.set(note.display);

          this.initialState = {...user};
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshMetadata.next(true);
          this.refreshLinkList.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('user.details.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public pendingChanges(): Observable<boolean> {

    if (this.form.dirty) {
      //   this.modalRef = this.modalService.open(PendingChangesModalComponent, {
      //     closeButton: false,
      //   });
      //
      //   return this.modalRef.afterClosed$.pipe(
      //     untilDestroyed(this),
      //     take(1),
      //     map(val => Boolean(val))
      //   );
      //
    }

    return of(true);
  }

  public onVersionChanged(): void {
    this.initDetails(false);
    this.refreshVersions.next(true);
    this.refreshChanges.next(true);
    this.refreshMetadata.next(true);
    this.refreshLinkList.next(true);
  }

  public onRefreshLinkList(): void {
    this.refreshLinkList.next(true);
  }

  public onOpenNewCommentModal(): void {
    // this.modalRef = this.modalService.open(NewCommentModalComponent, {
    //   closeButton: false,
    //   width: '912px',
    //   data: {
    //     id: this.id,
    //     contentType: this.initialState?.username,
    //     service: this.admin_users_service,
    //   },
    // });

    // this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => {
    //   if (callback.state === ModalState.Changed) {
    //     this.comments.loadComments();
    //   }
    // });
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }

  // public go_to_note(): void {
  //   this.labbooksService
  //     .getList()
  //     .pipe(
  //       untilDestroyed(this),
  //     ).subscribe(
  //     labbooks => {
  //       labbooks.data.forEach(
  //         lb => {
  //           this.labbooksService
  //             .getElements(lb.pk)
  //             .pipe(untilDestroyed(this))
  //             .subscribe(labBookElements => {
  //               labBookElements.map(element => {
  //                 if (element.child_object.pk === this.id) {
  //                   localStorage.setItem('pageVerticalposition', String((element.position_y) * 36))
  //                   void this.router.navigate([`/labbooks/${lb.pk}`])
  //                   //
  //                 }
  //               })
  //             });
  //         }
  //       )
  //     }
  //   )
  //
  //
  // }


}
