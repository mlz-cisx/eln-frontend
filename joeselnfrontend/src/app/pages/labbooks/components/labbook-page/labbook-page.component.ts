/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {HttpErrorResponse, HttpParams} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter, HostListener,
  OnDestroy,
  OnInit,
  QueryList, Renderer2,
  ViewChild,
  ViewChildren,
  AfterViewChecked
} from '@angular/core';
import {Validators} from '@angular/forms';
// import {Title} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {ModalState} from '@app/enums/modal-state.enum';
import {ProjectSidebarItem} from '@app/enums/project-sidebar-item.enum';
import {
  CommentsComponent
} from '@app/modules/comment/components/comments/comments.component';
import {
  NewCommentModalComponent
} from '@app/modules/comment/components/modals/new/new.component';
import type {
  LabBookDrawBoardComponent
} from '@app/modules/labbook/components/draw-board/draw-board/draw-board.component';
import {DescriptionModalComponent} from '@app/modules/shared/modals/description/description.component';
// import {PendingChangesModalComponent} from '@app/modules/shared/modals/pending-changes/pending-changes.component';
// import {LeaveProjectModalComponent} from '@app/pages/projects/components/modals/leave/leave.component';
// import {AuthService, LabbooksService, PageTitleService, ProjectsService, WebSocketService} from '@joeseln/services';
import {WebSocketService} from '@joeseln/services';
import {LabbooksService} from '@joeseln/services';
// import {UserStore} from '@app/stores/user';
import type {
  LabBook,
  LabBookPayload,
  Lock,
  Metadata,
  ModalCallback,
  Privileges,
  Project,
  User,
  LabBookElementPayload, LabBookElement
} from '@joeseln/types';
import {
  DialogRef,
  DialogService
} from '@ngneat/dialog';
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
import {NewLabBookModalComponent} from '../modals/new/new.component';
import {
  mockUser
} from "@joeseln/mocks";

interface FormLabBook {
  labbook_title: FormControl<string | null>;
  isTemplate: boolean;
  projects: FormControl<string[]>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-page',
  templateUrl: './labbook-page.component.html',
  styleUrls: ['./labbook-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookPageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  @ViewChildren('drawBoard')
  public drawBoards?: QueryList<LabBookDrawBoardComponent>;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public sidebarItem = ProjectSidebarItem.LabBooks;

  public currentUser: User = mockUser;

  public initialState?: LabBook;

  public metadata?: Metadata[];

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public showSidebar = false;

  public loading = true;

  public preloaded_id = '';

  public title_id = '';

  public submitted = false;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshMetadata = new EventEmitter<boolean>();

  public refreshLinkList = new EventEmitter<boolean>();

  public newModalComponent = NewLabBookModalComponent;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];


  public projectInput$ = new Subject<string>();


  public form = this.fb.group<FormLabBook>({
    labbook_title: this.fb.control(null, Validators.required),
    isTemplate: false,
    projects: this.fb.control([]),
  });

  public constructor(
    public readonly labBooksService: LabbooksService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    // private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    // private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    // private readonly projectsService: ProjectsService,
    // private readonly pageTitleService: PageTitleService,
    // private readonly titleService: Title,
    private readonly modalService: DialogService,
    // private readonly userStore: UserStore,
    private renderer2: Renderer2
  ) {
  }

  public get f() {
    return this.form.controls;
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

  public get descriptionTranslationKey(): string {
    return this.initialState?.description ? 'labBook.details.description.edit' : 'labBook.details.description.add';
  }

  private get labBook(): LabBookPayload {
    return {
      title: this.f.labbook_title.value!,
      is_template: this.f.isTemplate.value,
      projects: this.f.projects.value,
      metadata: this.metadata!,
    };
  }


  public ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;


    // this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
    //   this.currentUser = state.user;
    // });

    this.websocketService.subscribe([{model: 'labbook', pk: this.id}]);
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
      this.cdr.detectChanges();
      if (data.model_pk === this.id && !this.submitted) {
        this.refreshChanges.next(true);
        this.refreshVersions.next(true);
        this.submitted = false
      }
    });

    this.initSidebar();
    this.initSearchInput();
    this.initDetails();
    this.initPageTitle();
    // const pos = Number(localStorage.getItem('pageVerticalposition')) || 0;
    // localStorage.removeItem('pageVerticalposition');
    // if (pos !== 0) {
    //   setTimeout(() => this.scroll_to_position((pos)), 3000);
    // }

    // // Hack to relod tinymce
    // if (!localStorage.getItem('foo')) {
    //   localStorage.setItem('foo', 'no reload')
    //   location.reload()
    // } else {
    //   localStorage.removeItem('foo')
    // }

  }


  public ngOnDestroy(): void {
    this.websocketService.unsubscribe();
  }

  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        skip(1),
        debounceTime(500),
        switchMap(() => {
          this.cdr.markForCheck();
          if (!this.lock?.locked) {
            return this.labBooksService.lock(this.id);
          }

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
    //     // this.projectsService.get(params.projectId).subscribe(project => {
    //     //   this.projects = [...this.projects, project]
    //     //     .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
    //     //     .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
    //     //   this.cdr.markForCheck();
    //     // });
    //   }
    // });
  }

  public initSearchInput(): void {
    // this.projectInput$
    //   .pipe(
    //     untilDestroyed(this),
    //     debounceTime(500),
    //     //switchMap(input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
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

    if (!this.currentUser?.pk) {
      return;
    }

    this.preloaded_id = `${this.id}_preloaded_id`;
    this.title_id = `${this.id}_title_id`;

    this.labBooksService
      .get(this.id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(privilegesData => {
          const labBook = privilegesData.data;
          const privileges = privilegesData.privileges;
          this.form.patchValue(
            {
              labbook_title: labBook.title,
              isTemplate: labBook.is_template,
              projects: labBook.projects,
            },
            {emitEvent: false}
          );

          if (!privileges.edit) {
            this.form.disable({emitEvent: false});
          }

          return privilegesData;
        }),
        // switchMap(privilegesData => {
        //   if (privilegesData.data.projects.length) {
        //     return from(privilegesData.data.projects).pipe(
        //       mergeMap(id =>
        //         this.projectsService.get(id).pipe(
        //           untilDestroyed(this),
        //           catchError(() =>
        //             of({
        //               pk: id,
        //               name: this.translocoService.translate('formInput.unknownProject'),
        //               is_favourite: false,
        //             } as Project)
        //           )
        //         )
        //       ),
        //       map(project => {
        //         this.projects = [...this.projects, project]
        //           .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
        //           .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
        //         this.cdr.markForCheck();
        //       }),
        //       switchMap(() => of(privilegesData))
        //     );
        //   }
        //
        //   return of(privilegesData);
        // })
      )
      .subscribe(
        // labBook => {
        //   this.form.patchValue(
        //     {
        //       title: labBook.title,
        //       isTemplate: labBook.is_template,
        //       projects: labBook.projects,
        //     },
        //     {emitEvent: false}
        //   );
        // }
        privilegesData => {
          const labBook = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = labBook.title;
          //void this.pageTitleService.set(labBook.display);

          this.initialState = {...labBook};
          this.privileges = {...privileges};

          this.loading = false;

          if (formChanges) {
            this.initFormChanges();
          }

          this.cdr.markForCheck();
        },
        (error: HttpErrorResponse) => {
          if (error.status > 400 && 500 > error.status) {
            void this.router.navigate(['/']);
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
    this.submitted = true;
    this.labBooksService
      .patch(this.id, this.labBook)
      .pipe(untilDestroyed(this))
      .subscribe(
        labBook => {
          // if (this.lock?.locked && this.lockUser.ownUser) {
          //   this.labBooksService.unlock(this.id);
          // }

          this.detailsTitle = labBook.title;
          // void this.pageTitleService.set(labBook.display);

          this.initialState = {...labBook};
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshMetadata.next(true);
          this.refreshLinkList.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('labBook.details.toastr.success')
            .pipe(untilDestroyed(this))
          // .subscribe(success => {
          //   this.toastrService.success(success);
          // });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public canDeactivate(): Observable<boolean> {
    if (this.showSidebar) {
      // const userStoreValue = this.userStore.getValue();
      // const userSetting = 'SkipDialog-LeaveProject';
      //
      // const skipLeaveDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.[userSetting]);
      const skipLeaveDialog = true

      if (skipLeaveDialog) {
        return of(true);
      }

      // this.modalRef = this.modalService.open(LeaveProjectModalComponent, {
      //   closeButton: false,
      // });

      // return this.modalRef.afterClosed$.pipe(
      //   untilDestroyed(this),
      //   take(1),
      //   map(val => Boolean(val))
      // );
    }

    return of(true);
  }

  public pendingChangesDrawBoards(): boolean {
    // for (const element of this.drawBoards ?? []) {
    //   if (element.pendingChanges()) {
    //     return true;
    //   }
    // }

    return false;
  }

  public pendingChanges(): Observable<boolean> {
    if (this.form.dirty || this.pendingChangesDrawBoards()) {
      // this.modalRef = this.modalService.open(PendingChangesModalComponent, {
      //   closeButton: false,
      // });

      // return this.modalRef.afterClosed$.pipe(
      //   untilDestroyed(this),
      //   take(1),
      //   map(val => Boolean(val))
      // );
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
    this.modalRef = this.modalService.open(NewCommentModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        contentType: this.initialState?.content_type,
        service: this.labBooksService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => {
      if (callback.state === ModalState.Changed) {
        this.comments.loadComments();
      }
    });
  }

  public onOpenDescriptionModal(): void {
    this.labBooksService.lock(this.id).pipe(take(1)).subscribe();
    this.modalRef = this.modalService.open(DescriptionModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        description: this.initialState?.description ?? '',
        descriptionKey: 'description',
        service: this.labBooksService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.initialState = {...callback.data};
        this.form.markAsPristine();
        this.refreshChanges.next(true);
        this.refreshResetValue.next(true);
      }
      this.labBooksService.unlock(this.id).pipe(take(1)).subscribe();
    });
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }

  public goToBottom() {
    window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
  }

  public restructure() {
    const empty_spaces_alt: number[][] = [];
    let max_position = 0;
    let space_count = 0

    this.labBooksService
      .getElements(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        labBookElements => {
          labBookElements.forEach(element => {
              if (element.position_y > max_position) {
                space_count += (element.position_y - max_position)
                empty_spaces_alt.push(([element.position_y - 1, space_count]))
              }
              if ((element.position_y + element.height) > max_position) {
                max_position = element.position_y + element.height;
              }
            }
          );

          labBookElements.reverse();
          empty_spaces_alt.reverse().forEach(empty_space_elem => {
            labBookElements.forEach(labbook_elem => {
              if (empty_space_elem[0] <= labbook_elem.position_y) {
                labbook_elem.position_y -= empty_space_elem[1]
              }
            })
          })

          const elementsPayload = this.convertToLabBookElementPayload(labBookElements);

          this.labBooksService
            .updateAllElements(this.id, elementsPayload)
            .pipe(untilDestroyed(this))
            .subscribe(
              () => {
                this.loading = false;
                this.cdr.markForCheck();
                // setTimeout(() => location.reload(), 1000);
              },
              () => {
                this.loading = false;
                this.cdr.markForCheck();
              }
            );
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );

  }

  public convertToLabBookElementPayload(elements: LabBookElement<any>[]): LabBookElementPayload[] {
    return elements.map(element => ({
      pk: element.pk,
      width: element.width,
      height: element.height,
      position_x: element.position_x,
      position_y: element.position_y,
    }));
  }

  public scroll_to_position(pos: number) {
    window.scrollTo({top: pos, behavior: 'smooth'});
  }
}

