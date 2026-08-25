import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import DeliveryDashboard from "@/components/delivery/delivery-dashboard";

export default async function DeliveryPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "DELIVERY_STAFF") {
    redirect("/dashboard");
  }

  return <DeliveryDashboard />;
}
