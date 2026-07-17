import { NextResponse } from "next/server";
import { normalizeCampaign } from "@/lib/campaigns/normalize";
import {
  deleteCampaignStorage,
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("campaigns")
    .select("data")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const base = normalizeCampaign(data.data as Partial<CampaignRun> & { id: string });

  try {
    const campaign = await hydrateCampaignImages(supabase, user.id, base, { includeAds: true });
    return NextResponse.json({ campaign });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load images" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const body = await request.json();
  const campaign = normalizeCampaign({ ...body, id } as Partial<CampaignRun> & { id: string });

  try {
    await uploadCampaignImages(supabase, user.id, campaign);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image upload failed" },
      { status: 500 }
    );
  }

  const stripped = stripCampaignImages(campaign);

  const { error } = await supabase
    .from("campaigns")
    .update({ data: stripped })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: stripped });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  try {
    await deleteCampaignStorage(supabase, user.id, id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete assets" },
      { status: 500 }
    );
  }

  const { error } = await supabase.from("campaigns").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
