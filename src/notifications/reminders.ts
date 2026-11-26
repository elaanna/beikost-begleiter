import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { FOOD_BY_ID } from '@/data/foods';
import { addDays, todayIso } from '@/domain/dates';
import { introDays, planDays, SLOT_LABEL } from '@/domain/planner';
import type { Child, FoodLog, MealSlot } from '@/domain/types';

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
  if (discreet) return { title: `Zeit für ${SLOT_LABEL[slot]} 🥄`, body: 'Tippe hier, um den Plan zu sehen.' };
  if (newFoodId) {
    const f = FOOD_BY_ID[newFoodId];
    return {
      title: `${SLOT_LABEL[slot]}: neu ist ${f.name} ${f.emoji}`,
      body: `Tag ${newFoodDay} von ${introDays(f)} für ${child.name}. ${f.hint ? 'Bitte Hinweis in der App beachten.' : ''}`.trim(),
    };
  }
  return {
    title: `${SLOT_LABEL[slot]} für ${child.name}`,
    body: `${title}: ${foodIds.map((id) => FOOD_BY_ID[id].name).join(', ')}`,
  };
}

/**
 * Plant die Erinnerungen der nächsten 7 Tage neu (alle alten werden gelöscht).
 * Wird beim Start und nach Änderungen am Plan aufgerufen.
 */
export async function rescheduleReminders(child: Child | null, logs: FoodLog[], settings: ReminderSettings): Promise<number> {
  if (!remindersSupported) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
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
        content: { ...text, data: { url: '/heute' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
      });
      count += 1;
    }
  }
  return count;
}

export const lastScheduledDay = () => addDays(todayIso(), DAYS_AHEAD - 1);
