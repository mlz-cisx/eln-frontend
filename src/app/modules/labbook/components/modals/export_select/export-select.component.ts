import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  Output
} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {UntilDestroy} from "@ngneat/until-destroy";
import {Subject} from "rxjs";
import {DialogRef} from "@ngneat/dialog";

export type ContainType = 30 | 40 | 50 | 70;

export interface ExportFilter {
  containTypes: ContainType[];
  startTime: Date | null;
  endTime: Date | null;
}

@UntilDestroy()
@Component({
  selector: 'mlzeln-export-select-modal',
  templateUrl: './export-select.component.html',
  styleUrls: ['./export-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class ExportSelectModalComponent implements OnDestroy {

  @Output() apply = new EventEmitter<ExportFilter>();

  readonly containTypeLabels: Record<ContainType, string> = {
    30: 'Notes',
    40: 'Sketches',
    50: 'Files',
    70: 'Comments'
  };
  readonly containTypeOptions: ContainType[] = [30, 40, 50, 70];
  form: FormGroup = this.fb.group({
    containTypes: [[70]],
    startTime: [null],
    endTime: [null],
  });
  private unsubscribe$ = new Subject<void>();

  constructor(private fb: FormBuilder, public readonly modalRef: DialogRef) {
  }

  get isUnfiltered(): boolean {
    const v = this.form.value;
    const effectiveTypes = (v.containTypes || []).filter((t: number) => t !== 70);

    const noTypes = effectiveTypes.length === 0;
    const noDates = !v.startTime && !v.endTime;

    return noTypes && noDates;
  }

  get isOnlyComments(): boolean {
    const types = this.form.value.containTypes || [];
    return types.length === 1 && types[0] === 70;
  }

  ngOnInit(): void {
    this.form.get('containTypes')!.valueChanges.subscribe(types => {
      if (!types.includes(70)) {
        return;
      }

      if (types.length === 0) {
        this.form.get('containTypes')!.setValue([70], {emitEvent: false});
      }
    });
  }


  onApply(): void {
    const value = this.form.value;
    const filter: ExportFilter = {
      containTypes: value.containTypes?.length ? value.containTypes : null,
      startTime: value.startTime ? new Date(value.startTime) : null,
      endTime: value.endTime ? new Date(value.endTime) : null,
    };
    this.modalRef.close(filter);
  }

  toggleContainType(ct: ContainType) {
    const current = this.form.controls['containTypes'].value as ContainType[];

    if (current.includes(ct)) {
      this.form.controls['containTypes'].setValue(
        current.filter(v => v !== ct)
      );
    } else {
      this.form.controls['containTypes'].setValue([...current, ct]);
    }
  }


  ngOnDestroy() {
    // unsubscribe everything at modal exit
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
