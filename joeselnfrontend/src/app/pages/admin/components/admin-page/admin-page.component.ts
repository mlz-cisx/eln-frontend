/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {UserService, StatService} from "@app/services";
import {User, Stat} from "@joeseln/types";
import {Router} from "@angular/router";


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

  public constructor(
    private user_service: UserService,
    private readonly stat_service: StatService,
    private cdr: ChangeDetectorRef,
    private _router: Router,
  ) {
  }


  public ngOnInit(): void {
    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
      console.log(this.currentUser)
    });

    this.stat_service.get().pipe(untilDestroyed(this)).subscribe(data => {
      this.stat = data;
      this.cdr.detectChanges();
      console.log(this.stat);
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
