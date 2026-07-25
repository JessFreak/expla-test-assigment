import { Pipe, PipeTransform } from '@angular/core';

interface TimeInterval {
  label: string;
  seconds: number;
}

const TIME_INTERVALS: TimeInterval[] = [
  { label: 'm', seconds: 2592000 },
  { label: 'd', seconds: 86400 },
  { label: 'h', seconds: 3600 },
  { label: 'm', seconds: 60 },
] as const;

@Pipe({
  name: 'timeAgo',
  standalone: true,
})
export class TimeAgoPipe implements PipeTransform {
  transform(timestamp: number | null | undefined): string {
    if (!timestamp) return '';

    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    const matchedInterval = TIME_INTERVALS.find((i) => elapsedSeconds >= i.seconds);

    if (!matchedInterval) {
      return '1m';
    }

    const value = Math.floor(elapsedSeconds / matchedInterval.seconds);
    return `${value}${matchedInterval.label}`;
  }
}