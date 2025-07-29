import {HttpErrorResponse} from '@angular/common/http';
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
import {
  CommentsComponent
} from '@app/modules/comment/components/comments/comments.component';
import {
  AdminUsersService,
  AuthService,
  LabbooksService,
  NotesService,
  UserService,
} from '@app/services';
import type {
  PasswordPatchPayload,
  Privileges,
  Project,
  User,
  UserPatchPayload
} from '@joeseln/types';
import {DialogRef, DialogService} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {Observable, of, Subject} from 'rxjs';
import {debounceTime, map, skip, switchMap,} from 'rxjs/operators';


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


  public privileges?: Privileges;


  public modified = false;

  public showSidebar = false;

  public loading = true;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();


  public refreshLinkList = new EventEmitter<boolean>();


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
    });


    this.initSidebar();
    this.initSearchInput();
    this.initDetails();
    this.initPageTitle();
  }

  public ngOnDestroy(): void {
  }

  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        skip(1),
        debounceTime(500),
        switchMap(() => {
          this.cdr.markForCheck();


          return of([]);
        })
      )
      .subscribe();
  }

  public initSidebar(): void {


  }

  public initSearchInput(): void {

  }

  public initPageTitle(): void {

  }

  public initDetails(formChanges = true): void {


    this.admin_users_service
      .get(this.id)
      .pipe(
        untilDestroyed(this),
        map(privilegesData => {
          const user = privilegesData.data;
          const privileges = privilegesData.privileges;


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


          return of(privilegesData);
        })
      )
      .subscribe(
        privilegesData => {
          const user = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = user.username;


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

          this.detailsTitle = user.username;


          this.initialState = {...user};
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
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


          this.detailsTitle = user.username;


          this.initialState = {...user};
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
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


    return of(true);
  }

  public onVersionChanged(): void {
    this.initDetails(false);
    this.refreshVersions.next(true);
    this.refreshChanges.next(true);
    this.refreshLinkList.next(true);
  }

  public onRefreshLinkList(): void {
    this.refreshLinkList.next(true);
  }

  public onOpenNewCommentModal(): void {

  }

  public onUpdateMetadata(): void {
  }

}
