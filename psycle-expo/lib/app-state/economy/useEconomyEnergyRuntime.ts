import { useEffect, type Dispatch, type SetStateAction } from "react";

export interface EnergyRuntimeNextState {
  nextEnergy: number;
  nextLastEnergyUpdateTime: number | null;
}

export function recoverEnergyState(args: {
  effectiveFreeMaxEnergy: number;
  energy: number;
  energyRefillMs: number;
  lastEnergyUpdateTime: number | null;
  nowMs: number;
}): EnergyRuntimeNextState | null {
  if (args.lastEnergyUpdateTime === null) return null;
  if (args.energy >= args.effectiveFreeMaxEnergy) {
    return {
      nextEnergy: args.energy,
      nextLastEnergyUpdateTime: null,
    };
  }

  const elapsed = args.nowMs - args.lastEnergyUpdateTime;
  const recovered = Math.floor(elapsed / args.energyRefillMs);
  if (recovered <= 0) return null;

  const nextEnergy = Math.min(args.effectiveFreeMaxEnergy, args.energy + recovered);
  return {
    nextEnergy,
    nextLastEnergyUpdateTime:
      nextEnergy >= args.effectiveFreeMaxEnergy
        ? null
        : args.lastEnergyUpdateTime + recovered * args.energyRefillMs,
  };
}

export function useEconomyEnergyRuntime(args: {
  effectiveFreeMaxEnergy: number;
  energy: number;
  energyRefillMs: number;
  isHydrated: boolean;
  isSubscriptionActive: boolean;
  lastEnergyUpdateTime: number | null;
  setEnergy: Dispatch<SetStateAction<number>>;
  setLastEnergyUpdateTime: Dispatch<SetStateAction<number | null>>;
  subscriberMaxEnergy: number;
}): void {
  useEffect(() => {
    if (!args.isHydrated) return;

    if (args.isSubscriptionActive) {
      if (args.energy !== args.subscriberMaxEnergy) args.setEnergy(args.subscriberMaxEnergy);
      if (args.lastEnergyUpdateTime !== null) args.setLastEnergyUpdateTime(null);
      return;
    }

    if (args.energy > args.effectiveFreeMaxEnergy) {
      args.setEnergy(args.effectiveFreeMaxEnergy);
      args.setLastEnergyUpdateTime(null);
      return;
    }

    const recover = () => {
      const next = recoverEnergyState({
        effectiveFreeMaxEnergy: args.effectiveFreeMaxEnergy,
        energy: args.energy,
        energyRefillMs: args.energyRefillMs,
        lastEnergyUpdateTime: args.lastEnergyUpdateTime,
        nowMs: Date.now(),
      });
      if (!next) return;
      if (next.nextEnergy !== args.energy) args.setEnergy(next.nextEnergy);
      if (next.nextLastEnergyUpdateTime !== args.lastEnergyUpdateTime) {
        args.setLastEnergyUpdateTime(next.nextLastEnergyUpdateTime);
      }
    };

    recover();
    const interval = setInterval(recover, 60000);
    return () => clearInterval(interval);
  }, [
    args.effectiveFreeMaxEnergy,
    args.energy,
    args.energyRefillMs,
    args.isHydrated,
    args.isSubscriptionActive,
    args.lastEnergyUpdateTime,
    args.setEnergy,
    args.setLastEnergyUpdateTime,
    args.subscriberMaxEnergy,
  ]);
}
