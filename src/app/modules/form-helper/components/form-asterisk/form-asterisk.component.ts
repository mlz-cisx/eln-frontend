import { Component, Input, OnInit } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
    selector: 'mlzeln-form-asterisk',
    templateUrl: './form-asterisk.component.html',
    styleUrls: ['./form-asterisk.component.scss'],
    standalone: false
})
export class FormAsteriskComponent implements OnInit {
  @Input()
  public tooltipText?: string;

  public constructor(private readonly translocoService: TranslocoService) {}

  public ngOnInit(): void {
    if (!this.tooltipText) {
      this.translocoService
        .selectTranslate('form.mandatoryField')
        .pipe(untilDestroyed(this))
        .subscribe(text => {
          this.tooltipText = text;
        });
    }
  }
}
