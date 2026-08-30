import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/session";
import {
  applySyncOperations,
  syncOperationsSchema,
} from "@/features/rounds/syncService";

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> },
): Promise<NextResponse> => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const { roundId } = await params;
  if (!z.string().uuid().safeParse(roundId).success) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const parsed = syncOperationsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const result = await applySyncOperations(user.id, roundId, parsed.data);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.reason === "locked" ? 409 : 422 });
  }
  return NextResponse.json(result);
};
