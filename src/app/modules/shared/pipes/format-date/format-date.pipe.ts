import { Pipe, PipeTransform } from '@angular/core';
import { format, parseISO } from 'date-fns';

@Pipe({
    name: 'formatDate',
    standalone: false
})
export class FormatDatePipe implements PipeTransform {
  public transform(
    value?: string | null,
    withTime = true,
    formatDayString = 'yyyy-MM-dd',
    formatTimeString = "HH':'mm",
    formatSeparator = ', '
  ): string {
    if (!value) {
      return '';
    }

    const date = parseISO(value);
    return withTime ? format(date, `${formatDayString}${formatSeparator}${formatTimeString}`) : format(date, formatDayString);
  }
}
