import {HttpErrorResponse} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {Validators} from '@angular/forms';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {
  CommentsComponent
} from '@app/modules/comment/components/comments/comments.component';
import {
  NewCommentModalComponent
} from '@app/modules/comment/components/modals/new/new.component';
import { AuthService, PicturesService, UserService } from '@app/services';
import type { Picture, Privileges, Project, User } from '@joeseln/types';
import {DialogConfig, DialogRef, DialogService} from '@ngneat/dialog';
import {FormBuilder, FormControl} from '@ngneat/reactive-forms';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {Observable, of, Subject} from 'rxjs';
import {debounceTime, map, skip, switchMap,} from 'rxjs/operators';


interface FormPicture {
  title: FormControl<string | null>;
  height: number | null;
  width: number | null;
  aspectRatio: number | null;
  projects: FormControl<string[]>;
}

@UntilDestroy()
@Component({
  templateUrl: './picture-page.component.html',
  styleUrls: ['./picture-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicturePageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public currentUser: User | null = null;

  public initialState?: Picture;


  // some initialization
  public privileges: Privileges = {
    fullAccess: false,
    view: false,
    edit: false,
    delete: false,
    trash: false,
    restore: false
  };



  public modified = false;

  public showSidebar = false;

  public loading = true;

  public modalRef?: DialogRef;

  public readonly dateFormat = "yyyy-MM-dd HH':'mm";


  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshLinkList = new EventEmitter<boolean>();


  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  @ViewChild('uploadInput')
  public uploadInput!: ElementRef;

  public form = this.fb.group<FormPicture>({
    title: this.fb.control(null, Validators.required),
    height: null,
    width: null,
    aspectRatio: null,
    projects: this.fb.control([]),
  });

  public constructor(
    public readonly picturesService: PicturesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly titleService: Title,
    private readonly modalService: DialogService,
    private user_service: UserService,
  ) {
  }

  public get f() {
    return this.form.controls;
  }



  private get file(): any {
    return {
      title: this.f.title.value!,
      height: this.f.height.value,
      width: this.f.width.value,
      aspectRatio: this.f.aspectRatio.value ?? 1.0,
      projects: this.f.projects.value,
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

    this.picturesService
      .get(this.id)
      .pipe(
        untilDestroyed(this),
        map(privilegesData => {
          const picture = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.form.patchValue(
            {
              title: picture.title,
              height: picture.height,
              width: picture.width,
              aspectRatio: picture.width / picture.height,
              projects: picture.projects,
            },
            {emitEvent: false}
          );

          if (!privileges.edit) {
            this.form.disable({emitEvent: false});
          }

          return privilegesData;
        }),
      )
      .subscribe(
        privilegesData => {
          const picture = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = picture.title;
          // void this.pageTitleService.set(picture.display);

          this.initialState = {...picture};
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
  }

  public canDeactivate(): Observable<boolean> {

    return of(true);
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
    this.modalRef = this.modalService.open(NewCommentModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        contentType: this.initialState?.content_type,
        service: this.picturesService,
      },
    } as DialogConfig);

  }

  public onUpdateMetadata(): void {
  }
}
