import { NextResponse } from "next/server";
import { normalizeCampaign } from "@/lib/campaigns/normalize";
import {
  hydrateCampaignImages,
  stripCampaignImages,
  uploadCampaignImages,
} from "@/lib/campaigns/persistence";
import type { CampaignRun } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { supabase, user };
}

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("campaigns")
    .select("data, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const campaigns = (data ?? []).map((row) =>
    normalizeCampaign(row.data as Partial<CampaignRun> & { id: string })
  );

  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const body = await request.json();
  const campaign = normalizeCampaign(body as Partial<CampaignRun> & { id: string });

  try {
    await uploadCampaignImages(supabase, user.id, campaign);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image upload failed" },
      { status: 500 }
    );
  }

  const stripped = stripCampaignImages(campaign);

  const { error } = await supabase.from("campaigns").upsert(
    {
      id: campaign.id,
      user_id: user.id,
      data: stripped,
      created_at: campaign.createdAt,
    },
    { onConflict: "id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: stripped }, { status: 201 });
}
