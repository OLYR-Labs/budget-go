import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

export async function notifyUsers(
  userIds: string[],
  payload: { title: string; body: string; url?: string; tag?: string },
) {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (!ids.length) return;

  await prisma.notification.createMany({
    data: ids.map((userId) => ({
      userId,
      title: payload.title,
      body: payload.body,
      url: payload.url ?? null,
      type: payload.tag ?? "GENERAL",
    })),
  });

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: { in: ids } } });
  await Promise.all(subscriptions.map(async (subscription) => {
    const result = await sendPushNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload,
    );

    if (result.reason === "subscription_expired") {
      await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
    }
  }));
}
