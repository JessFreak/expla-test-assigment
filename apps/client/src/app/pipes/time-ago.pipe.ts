import { ChangeDetectorRef, inject, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { TIME_AGO_UPDATE_INTERVAL_MS, TIME_INTERVALS } from '../utils/constants';

@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: false,
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private timerId: number | null = null;

  transform(timestamp: number | null | undefined): string {
    if (!timestamp) return '';

    this.startUpdateTimer();

    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    const matchedInterval = TIME_INTERVALS.find((i) => elapsedSeconds >= i.seconds);

    if (!matchedInterval) {
      return '1m';
    }

    const value = Math.floor(elapsedSeconds / matchedInterval.seconds);
    return `${value}${matchedInterval.label}`;
  }

  private startUpdateTimer(): void {
    if (this.timerId !== null) return;

    this.timerId = window.setInterval(() => {
      this.cdr.markForCheck();
    }, TIME_AGO_UPDATE_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
    }
  }
}