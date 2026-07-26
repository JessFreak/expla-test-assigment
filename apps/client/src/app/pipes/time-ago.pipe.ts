import { ChangeDetectorRef, inject, OnDestroy, Pipe, PipeTransform } from '@angular/core';

interface TimeInterval {
  label: string;
  seconds: number;
}

const TIME_INTERVALS: TimeInterval[] = [
  { label: 'm', seconds: 2_592_000 },
  { label: 'd', seconds: 86_400 },
  { label: 'h', seconds: 3_600 },
  { label: 'm', seconds: 60 },
] as const;

const UPDATE_INTERVAL_MS = 60_000;

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
    }, UPDATE_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
    }
  }
}