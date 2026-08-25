import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { calculateDeliveryFee } from "@/lib/delivery";

type RouteResponse = {
  code?: string;
  routes?: Array<{
    distance?: number;
    geometry?: { coordinates?: Array<[number, number]> };
  }>;
};

async function getRoadRoute(fromLatitude: number, fromLongitude: number, toLatitude: number, toLongitude: number) {
  const url = new URL(`https://router.project-osrm.org/route/v1/driving/${fromLongitude},${fromLatitude};${toLongitude},${toLatitude}`);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) throw new Error("Routing service is unavailable.");

  const data = (await response.json()) as RouteResponse;
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route || !Number.isFinite(route.distance)) {
    throw new Error("No drivable route was found for this location.");
  }

  const routeCoordinates = (route.geometry?.coordinates ?? [])
    .filter((coordinate) => Array.isArray(coordinate) && coordinate.length >= 2 && Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1]))
    .map(([longitude, latitude]) => [latitude, longitude] as [number, number]);

  return { distanceKm: route.distance / 1000, routeCoordinates };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { branchId?: string; latitude?: number; longitude?: number };
    const branchId = body.branchId?.trim();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!branchId) return NextResponse.json({ error: "A delivery branch is required." }, { status: 400 });
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "A valid map location is required." }, { status: 400 });
    }

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, isActive: true },
      select: { id: true, name: true, latitude: true, longitude: true, deliveryRadius: true },
    });

    if (!branch) return NextResponse.json({ error: "The selected branch is no longer available." }, { status: 404 });

    const route = await getRoadRoute(branch.latitude, branch.longitude, latitude, longitude);
    const distanceKm = route.distanceKm;

    if (distanceKm > branch.deliveryRadius) {
      return NextResponse.json({
        deliverable: false,
        branch: branch.name,
        distanceKm: Number(distanceKm.toFixed(2)),
        radiusKm: branch.deliveryRadius,
        routeCoordinates: route.routeCoordinates,
        error: `This location is ${distanceKm.toFixed(1)} km by road from ${branch.name}. We currently deliver within ${branch.deliveryRadius} km of the branch.`,
      }, { status: 422 });
    }

    const { baseFee, perKmFee, deliveryFee } = calculateDeliveryFee(distanceKm);
    return NextResponse.json({
      deliverable: true,
      branch: branch.name,
      branchId: branch.id,
      distanceKm: Number(distanceKm.toFixed(2)),
      radiusKm: branch.deliveryRadius,
      baseFee,
      perKmFee,
      deliveryFee,
      routeCoordinates: route.routeCoordinates,
    });
  } catch (error) {
    console.error("Failed to calculate delivery quote:", error);
    return NextResponse.json({ error: "Unable to calculate a road route for this location. Please try again." }, { status: 503 });
  }
}
