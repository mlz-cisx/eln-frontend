import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
    selector: 'mlzeln-trash-notice',
    templateUrl: './notice.component.html',
    styleUrls: ['./notice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class TrashNoticeComponent {
  public constructor(public readonly translocoService: TranslocoService) {}
}
