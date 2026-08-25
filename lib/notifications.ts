import "server-only";

import webpush from "web-push";

import { prisma } from "@/lib/prisma";

type NotificationInput = {
  userIds: string[];
  type: string;
  title: string;
  body: string;
  url?: string;
  orderId?: string;
};

function configured() {
  return Boolean(
    process.env.VAPID_SUBJECT &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY,
  );
}

function configure() {
  if (!configured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return true;
}

export async function notifyUsers(input: NotificationInput) {
  const userIds = [...new Set(input.userIds.filter(Boolean))];
  if (!userIds.length) return;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      url: input.url,
      orderId: input.orderId,
    })),
  });

  if (!configure()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const payload = JSON.stringify({
        title: input.title,
        body: input.body,
        url: input.url ?? "/",
        tag: input.orderId ? `order-${input.orderId}` : `notification-${input.type}`,
      });

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
        );
      } catch (error: unknown) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : undefined;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
        } else {
          console.error("Push notification delivery failed:", error);
        }
      }
    }),
  );
}
