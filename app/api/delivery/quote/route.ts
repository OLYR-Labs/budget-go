import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { calculateDeliveryFee, haversineDistanceKm } from "@/lib/delivery";

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
      return NextResponse.json({ error: "A delivery branch is required." }, { status: 400 });
    }

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json({ error: "A valid map location is required." }, { status: 400 });
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
      return NextResponse.json({ error: "The selected branch is no longer available." }, { status: 404 });
    }

    const distanceKm = haversineDistanceKm(
      branch.latitude,
      branch.longitude,
      latitude,
      longitude,
    );

    if (distanceKm > branch.deliveryRadius) {
      return NextResponse.json(
        {
          deliverable: false,
          branch: branch.name,
          distanceKm: Number(distanceKm.toFixed(2)),
          radiusKm: branch.deliveryRadius,
          error: `This location is ${distanceKm.toFixed(1)} km from ${branch.name}. We currently deliver within ${branch.deliveryRadius} km of the branch.`,
        },
        { status: 422 },
      );
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
    });
  } catch (error) {
    console.error("Failed to calculate delivery quote:", error);

    return NextResponse.json(
      { error: "Unable to calculate delivery for this location." },
      { status: 500 },
    );
  }
}
