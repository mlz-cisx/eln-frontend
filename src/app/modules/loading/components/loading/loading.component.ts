import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Component({
    selector: 'mlzeln-loading',
    templateUrl: './loading.component.html',
    styleUrls: ['./loading.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class LoadingComponent {
  @Input()
  public loading = false;

  public constructor(public readonly translocoService: TranslocoService) {}
}
