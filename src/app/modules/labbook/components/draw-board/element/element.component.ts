/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChildren } from '@angular/core';
import type { LabBookElement, LabBookElementAddEvent } from '@joeseln/types';

interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

@Component({
  selector: 'eworkbench-labbook-draw-board-element',
  templateUrl: './element.component.html',
  styleUrls: ['./element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardElementComponent {
  @ViewChildren('elementComponent')
  public elements?: any;

  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<any>;

  @Input()
  public editable? = false;
}
