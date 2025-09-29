import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import {UntypedFormGroup, Validators, UntypedFormBuilder,} from '@angular/forms';
import {ModalState} from '@app/enums/modal-state.enum';
import {
  NotesService,
} from '@app/services';
import type {
  GroupPayload,
  Group
} from '@joeseln/types';
import {DialogRef} from '@ngneat/dialog';
import {TranslocoService} from '@ngneat/transloco';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastrService} from 'ngx-toastr';
import {Subject} from 'rxjs';
import {
  AdminGroupsService
} from "@app/services/admin_users/admin-groups.service";



@UntilDestroy()
@Component({
    selector: 'mlzeln-new-group-modal',
    templateUrl: './new.component.html',
    styleUrls: ['./new.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class NewGroupModalComponent implements OnInit {
  public initialState?: Group = this.modalRef.data?.initialState;

  public loading = false;

  public state = ModalState.Unchanged;

  public form = this.fb.group({
      groupname: [null, [Validators.required]],
    },

  );

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly notesService: NotesService,
    private readonly fb: UntypedFormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    public readonly admin_groups_service: AdminGroupsService
  ) {
  }

  private get f(): UntypedFormGroup['controls'] {
    return this.form.controls;
  }

  private get group(): GroupPayload {
    return {
      groupname: this.f['groupname'].value!,
    };
  }

  public ngOnInit(): void {
    this.initSearchInput();
    this.patchFormValues();
  }

  public initSearchInput(): void {

  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue(
        {
          groupname: this.initialState.groupname,
        },
        {emitEvent: false}
      );

    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.admin_groups_service
      .add(this.group)
      .pipe(untilDestroyed(this))
      .subscribe(
        group => {
          this.state = ModalState.Changed;
          this.modalRef.close({
            state: this.state,
            data: {newContent: group},
          });
          this.toastrService.success('New group created!')
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
