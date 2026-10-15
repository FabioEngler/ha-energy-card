import type { calculate } from './power';

type PowerReading = ReturnType<typeof calculate>;
export const BALANCE_GRACE_MS = 3000;

/** Hold derived values briefly while independently updated meters catch up. */
export class BalanceGracePeriod {
  private lastBalanced?: Pick<PowerReading, 'home' | 'sources'>;
  private mismatchSince?: number;

  reset() {
    this.lastBalanced = undefined;
    this.mismatchSince = undefined;
  }

  update(reading: PowerReading, now: number) {
    if (!reading.mismatch) {
      this.mismatchSince = undefined;
      // A source outage must remain visible and must not reuse an older reading.
      this.lastBalanced = reading.home === null ? undefined : { home: reading.home, sources: reading.sources };
      return { ...reading, updating: false, recheckIn: 0 };
    }

    this.mismatchSince ??= now;
    const remaining = BALANCE_GRACE_MS - (now - this.mismatchSince);
    if (remaining <= 0) return { ...reading, updating: false, recheckIn: 0 };

    const home = this.lastBalanced?.home ?? null;
    const measured = reading.consumers.reduce((sum, c) => sum + Math.max(0, c.power), 0);
    return {
      ...reading,
      home,
      other: home === null ? null : Math.max(0, home - measured),
      sources: this.lastBalanced?.sources ?? [],
      mismatch: false,
      updating: true,
      recheckIn: remaining,
    };
  }
}
