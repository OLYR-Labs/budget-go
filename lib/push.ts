import webpush from "web-push";

let configured = false;

function configureWebPush() {
  if (configured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@budgetgo.com";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushSubscriptionData = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: { title: string; body: string; url?: string; tag?: string },
) {
  if (!configureWebPush()) return { sent: false, reason: "push_not_configured" } as const;

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { sent: true } as const;
  } catch (error: unknown) {
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode)
      : undefined;

    if (statusCode === 404 || statusCode === 410) {
      return { sent: false, reason: "subscription_expired" } as const;
    }

    console.error("Web push delivery failed:", error);
    return { sent: false, reason: "delivery_failed" } as const;
  }
}
