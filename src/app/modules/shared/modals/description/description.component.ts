import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { WebSocketService } from '@app/services';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@jsverse/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, Observable } from 'rxjs';
import { catchError, debounceTime, filter, finalize, switchMap } from 'rxjs/operators';

interface FormDescription {
  content: string | null;
}

@UntilDestroy()
@Component({
    selector: 'mlzeln-description-modal',
    templateUrl: './description.component.html',
    styleUrls: ['./description.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DescriptionModalComponent implements OnInit, OnDestroy {
  public id: string = this.modalRef.data.id;

  public service: any = this.modalRef.data.service;

  public initialDescription: any = this.modalRef.data.description;

  public descriptionKey: string = this.modalRef.data.descriptionKey;

  private readonly liveUpdates: boolean = this.modalRef.data.liveUpdates === true;

  public loading = false;

  public conflict = false;

  private conflictTimeout?: ReturnType<typeof setTimeout>;

  public state = ModalState.Unchanged;

  private savedData: any;

  public form = this.fb.group<FormDescription>({
    content: null,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly websocketService: WebSocketService
  ) {}

  public get f() {
    return this.form.controls;
  }

  public get headerTranslationKey(): string {
    return this.initialDescription ? 'shared.descriptionModal.editDescription' : 'shared.descriptionModal.addDescription';
  }

  public get toastrSuccessTranslationKey(): string {
    return this.initialDescription ? 'shared.descriptionModal.toastr.edited' : 'shared.descriptionModal.toastr.added';
  }

  public get description(): any {
    return {
      [this.descriptionKey]: this.f.content.value,
    };
  }

  public ngOnInit(): void {
    this.f.content.setValue(this.initialDescription);
    this.f.content.valueChanges.pipe(debounceTime(1000), untilDestroyed(this)).subscribe(() => this.onSubmit());
    this.modalRef.beforeClose(result => this.onBeforeClose(result));

    if (this.liveUpdates) {
      // refresh content at latest state before editing
      this.loading = true;
      (this.service.get(this.id) as Observable<any>)
        .pipe(
          catchError(() => EMPTY),
          untilDestroyed(this),
          finalize(() => {
            this.loading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe(response => {
          this.initialDescription = response.data[this.descriptionKey] ?? '';
          this.f.content.setValue(this.initialDescription, { emitEvent: false });
          this.cdr.markForCheck();
        });

      this.websocketService.subscribeElement(this.id)
        .pipe(
          filter(event => event.model_name !== 'comments' && !this.loading),
          switchMap(() => (this.service.get(this.id) as Observable<any>).pipe(
            // Keep listening when a refresh request fails.
            catchError(() => EMPTY)
          )),
          untilDestroyed(this)
        )
        .subscribe(response => {
          if (this.loading) {
            return;
          }
          const content = response.data[this.descriptionKey] ?? '';
          if (this.f.content.value !== content) {
            this.showConflict();
          }
          this.initialDescription = content;
          this.f.content.setValue(this.initialDescription, {emitEvent: false});
          this.cdr.markForCheck();
        });
    }
  }

  public ngOnDestroy(): void {
    clearTimeout(this.conflictTimeout);
    if (this.liveUpdates) {
      this.websocketService.unsubscribeElement(this.id);
    }
  }

  private showConflict(): void {
    clearTimeout(this.conflictTimeout);
    this.conflict = true;
    this.conflictTimeout = setTimeout(() => {
      this.conflict = false;
      this.cdr.markForCheck();
    }, 5000);
  }

  private onBeforeClose(result: unknown): boolean {
    if (this.loading) {
      return false;
    }
    if (this.f.content.value !== this.initialDescription) {
      this.onSubmit(() => this.modalRef.close());
      return false;
    }
    if (!result && this.state === ModalState.Changed) {
      this.modalRef.close({ state: this.state, data: this.savedData });
      return false;
    }
    return true;
  }

  public onSubmit(onSaved?: () => void): void {
    if (this.loading || this.form.invalid || this.f.content.value === this.initialDescription) {
      return;
    }
    const description = this.description;
    this.loading = true;

    this.service
      .patch(this.id, description)
      .pipe(untilDestroyed(this))
      .subscribe(
        (response: any) => {
          this.state = ModalState.Changed;
          this.loading = false;
          this.savedData = response;
          this.initialDescription = description[this.descriptionKey];
          this.cdr.markForCheck();
          if (this.f.content.value !== this.initialDescription) {
            this.onSubmit(onSaved);
          } else {
            onSaved?.();
          }
          this.translocoService
            .selectTranslate(this.toastrSuccessTranslationKey)
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
}
