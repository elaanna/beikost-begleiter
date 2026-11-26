import { useMemo } from 'react';
import { planDays } from '@/domain/planner';
import { applySwaps } from '@/domain/swaps';
import type { PlanDay } from '@/domain/types';
import { useChild } from './AppContext';

/** Plan des aktiven Kindes inklusive getauschter Mahlzeiten. */
export function usePlanDays(from: string, days: number): PlanDay[] {
  const { activeChild: child, logs, swaps } = useChild();
  return useMemo(() => applySwaps(planDays(child, logs, from, days), swaps, child, logs), [child, logs, swaps, from, days]);
}
