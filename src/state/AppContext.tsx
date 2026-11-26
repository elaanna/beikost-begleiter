import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { CustomerInfo } from 'react-native-purchases';
import type { Child, FoodLog, MealSlot } from '@/domain/types';
import type { DigestionLog, StoolKind } from '@/domain/digestion';
import type { Caregiver, FamilySettings, ShiftKind } from '@/domain/shifts';
import { DEFAULT_SETTINGS } from '@/domain/shifts';
import { DEFAULT_REMINDERS, rescheduleReminders, type ReminderSettings } from '@/notifications/reminders';
import * as repo from '@/db/repo';
import { syncNow } from '@/sync/sync';
import { isSyncConfigured } from '@/sync/supabase';
import {
  configurePurchases,
  getCustomerInfo,
  hasEntitlement,
  isPurchasesConfigured,
} from '@/purchases/revenuecat';

interface AppState {
  ready: boolean;
  familyId: string;
  children: Child[];
  activeChild: Child | null;
  logs: FoodLog[];
  /** Bezahlt oder Vorschau-Modus (kein RevenueCat-Schlüssel hinterlegt). */
  isPro: boolean;
  previewMode: boolean;
  customerInfo: CustomerInfo | null;
  tutorialDone: boolean;
  finishTutorial: () => Promise<void>;
  syncState: 'aus' | 'bereit' | 'läuft' | 'fehler';
  lastSyncError: string | null;
  selectChild: (id: string) => Promise<void>;
  saveChild: (child: Child) => Promise<void>;
  removeChild: (id: string) => Promise<void>;
  addLog: (log: Omit<FoodLog, 'id' | 'childId'>) => Promise<string | null>;
  removeLog: (id: string) => Promise<void>;
  digestion: DigestionLog[];
  addDigestion: (date: string, kind: StoolKind) => Promise<string | null>;
  removeDigestion: (id: string) => Promise<void>;
  caregivers: Caregiver[];
  saveCaregiver: (c: Caregiver) => Promise<void>;
  removeCaregiver: (id: string) => Promise<void>;
  familySettings: FamilySettings;
  saveFamilySettings: (s: FamilySettings) => Promise<void>;
  /** Wird bei jeder Änderung an Diensten erhöht, damit Ansichten neu laden. */
  shiftsVersion: number;
  setShift: (caregiverId: string, date: string, kind: ShiftKind) => Promise<void>;
  reminders: ReminderSettings;
  saveReminders: (r: ReminderSettings) => Promise<void>;
  setCustomerInfo: (info: CustomerInfo | null) => void;
  reload: () => Promise<void>;
  /** Erhöht sich nach „Alle Daten löschen“: die Navigation startet dann neu. */
  epoch: number;
  /** Nach dem Löschen aller Daten: Navigation neu aufbauen und Zustand frisch laden. */
  resetApp: () => Promise<void>;
  sync: () => Promise<void>;
  /** Vorrat & Gefrierfach (familienweit). */
  stock: repo.StockItem[];
  saveStock: (item: repo.StockItem) => Promise<void>;
  removeStock: (id: string) => Promise<void>;
  /** Getauschte Mahlzeiten des aktiven Kindes. */
  swaps: repo.PlanSwap[];
  setSwap: (date: string, slot: MealSlot, recipeId: string | null) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children: content }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [familyId, setFamilyId] = useState('');
  const [kids, setKids] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [tutorialDone, setTutorialDone] = useState(false);
  const [digestion, setDigestion] = useState<DigestionLog[]>([]);
  const [stock, setStock] = useState<repo.StockItem[]>([]);
  const [swaps, setSwaps] = useState<repo.PlanSwap[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [familySettings, setFamilySettings] = useState<FamilySettings>(DEFAULT_SETTINGS);
  const [shiftsVersion, setShiftsVersion] = useState(0);
  const [reminders, setReminders] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [syncState, setSyncState] = useState<AppState['syncState']>(isSyncConfigured ? 'bereit' : 'aus');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const fid = await repo.ensureFamilyId(db);
    const list = await repo.listChildren(db);
    const stored = await repo.getMeta(db, 'active_child');
    const active = list.find((c) => c.id === stored) ?? list[0] ?? null;
    setTutorialDone((await repo.getMeta(db, 'tutorial_done')) === '1');
    setFamilyId(fid);
    setKids(list);
    setActiveId(active?.id ?? null);
    setLogs(active ? await repo.listLogs(db, active.id) : []);
    setSwaps(active ? await repo.listSwaps(db, active.id) : []);
    setStock(await repo.listStock(db));
    setDigestion(active ? await repo.listDigestion(db, active.id) : []);
    setCaregivers(await repo.listCaregivers(db));
    setFamilySettings(await repo.getFamilySettings(db, fid));
    const storedReminders = await repo.getMeta(db, 'reminders');
    setReminders(storedReminders ? { ...DEFAULT_REMINDERS, ...JSON.parse(storedReminders) } : DEFAULT_REMINDERS);
    setShiftsVersion((v) => v + 1);
  }, [db]);

  const sync = useCallback(async () => {
    if (!isSyncConfigured) return;
    setSyncState('läuft');
    try {
      await syncNow(db);
      setSyncState('bereit');
      setLastSyncError(null);
      await reload();
    } catch (e) {
      setSyncState('fehler');
      setLastSyncError(e instanceof Error ? e.message : String(e));
    }
  }, [db, reload]);

  useEffect(() => {
    (async () => {
      await reload();
      setReady(true);
      configurePurchases();
      if (isPurchasesConfigured) {
        try {
          setCustomerInfo(await getCustomerInfo());
        } catch {
          // offline: Kaufstatus wird beim nächsten Start erneut geprüft
        }
      }
      void sync();
    })();
  }, [reload, sync]);

  const activeChild = kids.find((c) => c.id === activeId) ?? null;

  // Erinnerungen neu planen, wenn sich Plan, Einträge oder Einstellungen ändern (verzögert, um Mehrfachaufrufe zu bündeln)
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      rescheduleReminders(activeChild, logs, reminders).catch(() => undefined);
    }, 800);
    return () => clearTimeout(t);
  }, [ready, activeChild, logs, reminders]);

  const value = useMemo<AppState>(
    () => ({
      ready,
      familyId,
      children: kids,
      activeChild,
      logs,
      isPro: !isPurchasesConfigured || hasEntitlement(customerInfo),
      previewMode: !isPurchasesConfigured,
      customerInfo,
      tutorialDone,
      finishTutorial: async () => {
        await repo.setMeta(db, 'tutorial_done', '1');
        setTutorialDone(true);
      },
      syncState,
      lastSyncError,
      selectChild: async (id) => {
        await repo.setMeta(db, 'active_child', id);
        await reload();
      },
      saveChild: async (child) => {
        await repo.saveChild(db, child);
        await repo.setMeta(db, 'active_child', child.id);
        await reload();
        void sync();
      },
      removeChild: async (id) => {
        await repo.deleteChild(db, id);
        await reload();
        void sync();
      },
      addLog: async (log) => {
        if (!activeChild) return null;
        const id = await repo.addLog(db, familyId, { ...log, childId: activeChild.id });
        setLogs(await repo.listLogs(db, activeChild.id));
        void sync();
        return id;
      },
      removeLog: async (id) => {
        await repo.deleteLog(db, id);
        if (activeChild) setLogs(await repo.listLogs(db, activeChild.id));
        void sync();
      },
      digestion,
      addDigestion: async (date, kind) => {
        if (!activeChild) return null;
        const id = await repo.addDigestion(db, familyId, activeChild.id, date, kind);
        setDigestion(await repo.listDigestion(db, activeChild.id));
        void sync();
        return id;
      },
      removeDigestion: async (id) => {
        await repo.deleteDigestion(db, id);
        if (activeChild) setDigestion(await repo.listDigestion(db, activeChild.id));
        void sync();
      },
      caregivers,
      saveCaregiver: async (c) => {
        await repo.saveCaregiver(db, familyId, c);
        setCaregivers(await repo.listCaregivers(db));
        void sync();
      },
      removeCaregiver: async (id) => {
        await repo.deleteCaregiver(db, id);
        setCaregivers(await repo.listCaregivers(db));
        void sync();
      },
      familySettings,
      saveFamilySettings: async (fs) => {
        await repo.saveFamilySettings(db, familyId, fs);
        setFamilySettings(fs);
        void sync();
      },
      shiftsVersion,
      setShift: async (caregiverId, date, kind) => {
        await repo.setShift(db, familyId, caregiverId, date, kind);
        setShiftsVersion((v) => v + 1);
        void sync();
      },
      reminders,
      saveReminders: async (r) => {
        await repo.setMeta(db, 'reminders', JSON.stringify(r));
        setReminders(r);
      },
      setCustomerInfo,
      reload,
      epoch,
      resetApp: async () => {
        setReady(false);
        setEpoch((e) => e + 1);
        await reload();
        setReady(true);
      },
      sync,
      stock,
      saveStock: async (item) => {
        await repo.saveStock(db, familyId, item);
        setStock(await repo.listStock(db));
        void sync();
      },
      removeStock: async (id) => {
        await repo.deleteStock(db, id);
        setStock(await repo.listStock(db));
        void sync();
      },
      swaps,
      setSwap: async (date, slot, recipeId) => {
        if (!activeChild) return;
        await repo.setSwap(db, familyId, activeChild.id, date, slot, recipeId);
        setSwaps(await repo.listSwaps(db, activeChild.id));
        void sync();
      },
    }),
    [stock, swaps, ready, epoch, familyId, kids, activeChild, logs, customerInfo, tutorialDone, syncState, lastSyncError, db, reload, sync,
      digestion, caregivers, familySettings, shiftsVersion, reminders],
  );

  return <Ctx.Provider value={value}>{content}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp außerhalb von AppProvider');
  return v;
}

/** Wie useApp, garantiert aber ein aktives Kind (nur in Screens nach dem Onboarding verwenden). */
export function useChild(): AppState & { activeChild: Child } {
  const app = useApp();
  if (!app.activeChild) throw new Error('Kein Kind angelegt');
  return app as AppState & { activeChild: Child };
}
