import { NextResponse, type NextRequest } from "next/server";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";
import { upsertProjectBeneficiaries } from "@/lib/dashboard-repository";
import { BENEFICIARY_TYPE_KEYS, BENEFICIARY_TYPE_META, type BeneficiaryTypeKey } from "@/lib/dashboard-data";

type BeneficiaryInput = {
  type: BeneficiaryTypeKey;
  direct: number;
  indirect: number;
  includeInTotals: boolean;
};

const isBeneficiaryType = (value: unknown): value is BeneficiaryTypeKey =>
  typeof value === "string" &&
  (BENEFICIARY_TYPE_KEYS as readonly string[]).includes(value);

const normalizeCount = (value: unknown): number => {
  if (typeof value !== "number") {
    return 0;
  }
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
};

const normalizeIncludeInTotals = (value: unknown, type: BeneficiaryTypeKey): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  return BENEFICIARY_TYPE_META[type].includeInTotals;
};

export async function POST(request: NextRequest) {
  try {
    await requireUserSession();
    const payload = await request.json();

    const projectIdRaw = payload?.projectId;
    if (typeof projectIdRaw !== "string" || !projectIdRaw.trim()) {
      return NextResponse.json({ message: "A valid project id is required." }, { status: 400 });
    }

    if (!Array.isArray(payload?.beneficiaries)) {
      return NextResponse.json(
        { message: "Beneficiary payload must be an array." },
        { status: 400 }
      );
    }

    const normalized: BeneficiaryInput[] = [];
    payload.beneficiaries.forEach((entry: unknown) => {
      if (!entry || typeof entry !== "object") {
        return;
      }
      const type = (entry as { type?: unknown }).type;
      if (!isBeneficiaryType(type)) {
        return;
      }
      const direct = normalizeCount((entry as { direct?: unknown }).direct);
      const indirect = normalizeCount((entry as { indirect?: unknown }).indirect);
      const includeInTotals = normalizeIncludeInTotals(
        (entry as { includeInTotals?: unknown }).includeInTotals,
        type
      );
      normalized.push({ type, direct, indirect, includeInTotals });
    });

    if (!normalized.length) {
      return NextResponse.json(
        { message: "At least one beneficiary entry is required." },
        { status: 400 }
      );
    }

    // Ensure every beneficiary type is represented to maintain data consistency.
    const completePayload: BeneficiaryInput[] = BENEFICIARY_TYPE_KEYS.map((key) => {
      const existing = normalized.find((entry) => entry.type === key);
      if (existing) {
        return existing;
      }
      return {
        type: key,
        direct: 0,
        indirect: 0,
        includeInTotals: BENEFICIARY_TYPE_META[key].includeInTotals,
      };
    });

    await upsertProjectBeneficiaries({
      projectId: projectIdRaw.trim(),
      entries: completePayload.map((entry) => ({
        type: entry.type,
        direct: entry.direct,
        indirect: entry.indirect,
        includeInTotals: entry.includeInTotals,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      console.error("Failed to upsert beneficiaries", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("Unexpected error while upserting beneficiaries", error);
    return NextResponse.json(
      { message: "Unable to save beneficiary totals." },
      { status: 500 }
    );
  }
}
