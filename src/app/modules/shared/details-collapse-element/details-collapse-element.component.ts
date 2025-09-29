import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'mlzeln-details-collapse-element',
    templateUrl: './details-collapse-element.component.html',
    styleUrls: ['./details-collapse-element.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DetailsCollapseElementComponent {
  @Input()
  public loading = false;

  @Input()
  public labelText?: string;

  public collapsed = false;

  public onToggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }
}
