import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

/**
 * Bezahlmodell: „Beikost-Paket“ = 12 Monate Zugang als Einmalkauf (nicht automatisch verlängernd),
 * alternativ Monatsabo. In RevenueCat beide Produkte an das Entitlement ENTITLEMENT hängen.
 *
 * App Store: Produkt „beikost_paket_12m“ als *Non-Renewing Subscription* (Laufzeit 12 Monate in RevenueCat hinterlegen),
 *            „beikost_monat“ als Auto-Renewable Subscription.
 * Google Play: entsprechend „Prepaid plan“ (12 Monate) und Abo.
 */
export const ENTITLEMENT = 'beikost_paket';

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  default: undefined,
});

/** Ohne Schlüssel (z. B. Web-Vorschau, Expo Go) läuft die App im Vorschau-Modus mit allen Funktionen. */
export const isPurchasesConfigured = Boolean(API_KEY);

let configured = false;

export function configurePurchases(appUserId?: string): void {
  if (!API_KEY || configured) return;
  Purchases.configure({ apiKey: API_KEY, appUserID: appUserId });
  configured = true;
}

export function hasEntitlement(info: CustomerInfo | null): boolean {
  return Boolean(info?.entitlements.active[ENTITLEMENT]);
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.getCustomerInfo();
}

export async function getPackages(): Promise<PurchasesPackage[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

export type PurchaseOutcome = 'gekauft' | 'abgebrochen' | 'fehler';

export async function buy(pkg: PurchasesPackage): Promise<{ outcome: PurchaseOutcome; info?: CustomerInfo; message?: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { outcome: hasEntitlement(customerInfo) ? 'gekauft' : 'fehler', info: customerInfo };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err.userCancelled) return { outcome: 'abgebrochen' };
    return { outcome: 'fehler', message: err.message };
  }
}

export async function restore(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.restorePurchases();
}

/** Ablaufdatum des Zugangs, für die Anzeige „gültig bis“. */
export function accessUntil(info: CustomerInfo | null): string | null {
  return info?.entitlements.active[ENTITLEMENT]?.expirationDate ?? null;
}
