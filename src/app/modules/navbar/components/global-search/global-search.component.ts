/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {HttpParams} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  ContentTypeModelService,
  LabbooksService,
  SearchService
} from '@app/services';
import type {ContentTypeModels} from '@joeseln/types';
import {FormBuilder} from '@ngneat/reactive-forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {BsDropdownDirective} from 'ngx-bootstrap/dropdown';
import {debounceTime, skip} from 'rxjs/operators';
import {Router} from "@angular/router";

interface FromSearch {
  search: string | null;
  appointment: boolean;
  note: boolean;
  contact: boolean;
  dmp: boolean;
  dss: boolean;
  file: boolean;
  labbook: boolean;
  picture: boolean;
  plugin: boolean;
  project: boolean;
  resource: boolean;
  drive: boolean;
  task: boolean;
  taskboard: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-global-search',
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchComponent implements OnInit {
  @ViewChild('searchDropdown')
  public dropdown!: BsDropdownDirective;

  @ViewChild('searchInput')
  public searchInput!: ElementRef;

  public loading = false;

  public selectedContentTypes: string[] = [];

  public params = new HttpParams();

  public results: any[] = [];

  public form = this.fb.group<FromSearch>({
    search: null,
    appointment: false,
    note: false,
    contact: false,
    dmp: false,
    dss: false,
    file: false,
    labbook: false,
    picture: false,
    plugin: false,
    project: false,
    resource: false,
    drive: false,
    task: false,
    taskboard: false,
  });

  public constructor(
    private readonly searchService: SearchService,
    private readonly contentTypeModelService: ContentTypeModelService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly labbooksService: LabbooksService,
    private readonly router: Router,
  ) {
  }

  public get f() {
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.initSearch();
  }

  public initSearch(): void {
    this.f.search.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(() => {
      this.search();
    });
  }

  public get searchText(): string | null {
    return this.f.search.value;
  }

  public onChangeFilter(event: any, contentType: ContentTypeModels): void {
    const modelName = this.contentTypeModelService.get(contentType, 'modelName');
    if (modelName) {
      if (event.target.checked) {
        this.selectedContentTypes.push(modelName);
      } else {
        const index = this.selectedContentTypes.indexOf(modelName);
        this.selectedContentTypes.splice(index, 1);
      }
      this.search();
    }
    this.searchInput.nativeElement.focus();
  }

  public search(): void {
    if (this.searchText) {
      this.loading = true;
      this.params = this.params.set('model', this.selectedContentTypes.join(','));
      this.searchService
        .search(this.searchText, this.params)
        .pipe(untilDestroyed(this))
        .subscribe(results => {
          this.results = [...results];
          this.loading = false;
          this.dropdown.show();
          this.cdr.markForCheck();
        });
    } else {
      this.results = [];
    }
    this.cdr.markForCheck();
  }

  public go_to_labbook(result_pk: any): void {
    this.labbooksService
      .getList()
      .pipe(
        untilDestroyed(this),
      ).subscribe(
      labbooks => {
        labbooks.data.forEach(
          lb => {
            this.labbooksService
              .getElements(lb.pk)
              .pipe(untilDestroyed(this))
              .subscribe(labBookElements => {
                labBookElements.map(element => {
                  // if (element.child_object.pk === result_pk) {
                  //   localStorage.setItem('pageVerticalposition', String((element.position_y) * 36))
                  //   // void this.router.navigate([`/labbooks/${lb.pk}`])
                  //   //
                  // }
                })
              });
          }
        )
      }
    )


  }

  public resetSearch(): void {
    this.form.reset();
  }

  public hideDropdown(labbook_pos_y: any, element_pk: any, content_type:any): void {
    localStorage.setItem('pageVerticalposition', String((labbook_pos_y) * 36))
    localStorage.setItem('element_pk', String(element_pk))
    localStorage.setItem('content_type', String(content_type))
    localStorage.setItem('search_text', String(this.searchText))
    this.dropdown.hide();
    this.resetSearch();
  }
}
