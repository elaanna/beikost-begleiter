import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { FOOD_BY_ID } from '@/data/foods';
import { addDays, todayIso } from '@/domain/dates';
import { introDays, planDays, SLOT_LABEL } from '@/domain/planner';
import type { Child, FoodLog, MealSlot } from '@/domain/types';
import { t } from '@/i18n';
import { appointmentReminderText, reminderAt, type Appointment } from '@/domain/calendar';

export interface ReminderSettings {
  enabled: boolean;
  /** Uhrzeit der Erinnerung je Mahlzeit, HH:MM. */
  times: Record<MealSlot, string>;
  /** Auf dem Sperrbildschirm nur „Zeit für Mittag“ zeigen – ohne Namen des Kindes und Lebensmittel. */
  discreet: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false,
  times: { mittag: '11:30', nachmittag: '15:00', abend: '17:30' },
  discreet: false,
};

const CHANNEL = 'mahlzeiten';
const DAYS_AHEAD = 7;

export const remindersSupported = Platform.OS !== 'web';

/** Fragt die Erlaubnis an. Gibt true zurück, wenn Erinnerungen erlaubt sind. */
export async function requestReminderPermission(): Promise<boolean> {
  if (!remindersSupported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Mahlzeiten',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const res = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return res.granted || res.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Text einer Erinnerung – das neue Lebensmittel steht im Vordergrund. */
export function reminderText(child: Child, slot: MealSlot, title: string, foodIds: string[], newFoodId?: string, newFoodDay?: number, discreet = false) {
  if (discreet) return { title: t('Zeit für {0} 🥄', { 0: SLOT_LABEL[slot] }), body: t('Tippe hier, um den Plan zu sehen.') };
  if (newFoodId) {
    const f = FOOD_BY_ID[newFoodId];
    return {
      title: t('{0}: neu ist {1} {2}', { 0: SLOT_LABEL[slot], 1: f.name, 2: f.emoji }),
      body: t('Tag {0} von {1} für {2}. {3}', { 0: newFoodDay, 1: introDays(f), 2: child.name, 3: f.hint ? t('Bitte Hinweis in der App beachten.') : '' }).trim(),
    };
  }
  return {
    title: t('{0} für {1}', { 0: SLOT_LABEL[slot], 1: child.name }),
    body: `${title}: ${foodIds.map((id) => FOOD_BY_ID[id].name).join(', ')}`,
  };
}

/**
 * Plant die Erinnerungen der nächsten 7 Tage neu (alle alten werden gelöscht).
 * Wird beim Start und nach Änderungen am Plan aufgerufen.
 */
export async function rescheduleReminders(child: Child | null, logs: FoodLog[], settings: ReminderSettings): Promise<number> {
  if (!remindersSupported) return 0;
  await cancelScheduled((id) => !id.startsWith(APPOINTMENT_PREFIX));
  // In der Kleinkind-Phase gibt es keinen Breiplan mehr – Brei-Erinnerungen wären falsch
  if (!settings.enabled || !child || child.tableSince) return 0;

  const now = Date.now();
  let count = 0;
  for (const day of planDays(child, logs, todayIso(), DAYS_AHEAD)) {
    for (const meal of day.meals) {
      const [h, m] = settings.times[meal.slot].split(':').map(Number);
      const [y, mo, d] = day.date.split('-').map(Number);
      const at = new Date(y, mo - 1, d, h, m, 0);
      if (at.getTime() <= now) continue;
      const text = reminderText(child, meal.slot, meal.title, meal.foodIds, meal.newFoodId, meal.newFoodDay, settings.discreet);
      await Notifications.scheduleNotificationAsync({
        identifier: `meal-${day.date}-${meal.slot}`,
        content: { ...text, data: { url: '/heute' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
      });
      count += 1;
    }
  }
  return count;
}

export const lastScheduledDay = () => addDays(todayIso(), DAYS_AHEAD - 1);

// ---------- Familienkalender ----------

const APPOINTMENT_PREFIX = 'termin-';

/** Nur ausgewählte geplante Erinnerungen löschen (Mahlzeiten und Termine sind getrennt). */
async function cancelScheduled(match: (identifier: string) => boolean): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) if (match(n.identifier)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
}

/**
 * Erinnerungen an Termine neu planen: am Vortag um 18 Uhr, höchstens 60 Tage im Voraus.
 * `discreet` folgt der Einstellung für den Sperrbildschirm (dann ohne Art des Termins und ohne Namen).
 */
export async function rescheduleAppointments(appointments: Appointment[], childName: (childId: string) => string, discreet: boolean): Promise<number> {
  if (!remindersSupported) return 0;
  await cancelScheduled((id) => id.startsWith(APPOINTMENT_PREFIX));
  const now = Date.now();
  const limit = now + 60 * 24 * 3600 * 1000;
  let count = 0;
  for (const a of appointments) {
    if (!a.remind) continue;
    const at = reminderAt(a);
    if (at.getTime() <= now || at.getTime() > limit) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `${APPOINTMENT_PREFIX}${a.id}`,
      content: { ...appointmentReminderText(a, childName(a.childId), discreet), data: { url: '/termine' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
    });
    count += 1;
  }
  return count;
}

/** Beim Löschen aller Daten: auch alle geplanten Erinnerungen entfernen. */
export async function cancelAllReminders(): Promise<void> {
  if (remindersSupported) await Notifications.cancelAllScheduledNotificationsAsync();
}
