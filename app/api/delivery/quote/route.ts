import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const DEFAULT_BASE_FEE = 100;
const DEFAULT_PER_KM_FEE = 30;

function haversineDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const dLatitude = toRadians(latitude2 - latitude1);
  const dLongitude = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(dLongitude / 2) ** 2;

  return (
    2 * earthRadiusKm * Math.asin(Math.sqrt(a))
  );
}

function numberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      branchId?: string;
      latitude?: number;
      longitude?: number;
    };

    const branchId = body.branchId?.trim();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!branchId) {
      return NextResponse.json(
        { error: "A delivery branch is required." },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: "A valid map location is required." },
        { status: 400 },
      );
    }

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, isActive: true },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        deliveryRadius: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "The selected branch is no longer available." },
        { status: 404 },
      );
    }

    const distanceKm = haversineDistanceKm(
      branch.latitude,
      branch.longitude,
      latitude,
      longitude,
    );

    const radiusKm = branch.deliveryRadius;

    if (distanceKm > radiusKm) {
      return NextResponse.json(
        {
          deliverable: false,
          branch: branch.name,
          distanceKm: Number(distanceKm.toFixed(2)),
          radiusKm,
          error: `This location is ${distanceKm.toFixed(1)} km from ${branch.name}. We currently deliver within ${radiusKm} km of the branch.`,
        },
        { status: 422 },
      );
    }

    const baseFee = numberFromEnv(
      "DELIVERY_BASE_FEE_LKR",
      DEFAULT_BASE_FEE,
    );
    const perKmFee = numberFromEnv(
      "DELIVERY_PER_KM_FEE_LKR",
      DEFAULT_PER_KM_FEE,
    );

    const rawFee = baseFee + distanceKm * perKmFee;
    const deliveryFee = Math.ceil(rawFee / 10) * 10;

    return NextResponse.json({
      deliverable: true,
      branch: branch.name,
      branchId: branch.id,
      distanceKm: Number(distanceKm.toFixed(2)),
      radiusKm,
      baseFee,
      perKmFee,
      deliveryFee,
    });
  } catch (error) {
    console.error("Failed to calculate delivery quote:", error);

    return NextResponse.json(
      { error: "Unable to calculate delivery for this location." },
      { status: 500 },
    );
  }
}
