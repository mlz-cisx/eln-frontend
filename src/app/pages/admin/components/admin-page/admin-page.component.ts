/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit, ViewChild,
} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {UserService, StatService} from "@app/services";
import {User, Stat, ModalCallback} from "@joeseln/types";
import {ActivatedRoute, Router} from "@angular/router";
import {
  NewLabBookModalComponent
} from "@app/pages/labbooks/components/modals/new/new.component";
import {DialogConfig, DialogRef, DialogService} from "@ngneat/dialog";
import {take} from "rxjs/operators";
import {ModalState} from "@app/enums/modal-state.enum";
import {TableViewComponent} from "@joeseln/table";
import {
  UploadLabBookModalComponent
} from "@app/pages/labbooks/components/modals/upload/new.component";


@UntilDestroy()
@Component({
  selector: 'joeseln-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent implements OnInit {


  public currentUser: User | null = null;
  public stat: Stat | null = null;

  public modalRef?: DialogRef;

  public showSidebar = false;

  @ViewChild('tableView', {static: true})
  public tableView!: TableViewComponent;

  public constructor(
    private user_service: UserService,
    private readonly stat_service: StatService,
    private cdr: ChangeDetectorRef,
    private _router: Router,
    private readonly route: ActivatedRoute,
    private readonly modalService: DialogService,
  ) {
  }


  public ngOnInit(): void {
    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.stat_service.get().pipe(untilDestroyed(this)).subscribe(data => {
      this.stat = data;
      this.cdr.detectChanges();
    });
  }


  public go_to_osers() {
    console.log('users')
    this._router.navigate(['/admin/users'])
  }

  public go_to_groups() {
        this._router.navigate(['/admin/groups'])
  }

  public go_to_admins() {
    console.log('admins')
    this._router.navigate(['/admin/admins'])
  }

  public upload_labbook() {

    this.modalRef = this.modalService.open(UploadLabBookModalComponent, {
      closeButton: false,
      data: {withSidebar: this.showSidebar, initialState: null},
    } as DialogConfig);

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }


  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      void this._router.navigate(callback.navigate, {relativeTo: this.route});
    } else if (callback?.state === ModalState.Changed) {
      this.tableView.loadData();
    }
  }

  public formatNumber(value: number | null | undefined): string {
    if (value == null) return '0';
    if (value >= 1e6) {
      return (value / 1e6).toFixed(2) + 'M'; // millions
    } else if (value >= 1e3) {
      return (value / 1e3).toFixed(2) + 'K'; // thousands
    } else {
      return value.toString();
    }
  }
}
