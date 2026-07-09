import { NextRequest, NextResponse } from "next/server";
import { getOpenAIConfig } from "@/lib/openai/config";
import { runCreativePipeline } from "@/lib/creative/pipeline";
import type { CreativeDirectorInput } from "@/lib/creative/types";

/**
 * Reusable Enterprise Creative Director endpoint.
 * Not limited to social ads — supports all campaign asset types.
 */
export async function POST(req: NextRequest) {
  let input: CreativeDirectorInput;

  try {
    input = (await req.json()) as CreativeDirectorInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!input.assetType) {
    return NextResponse.json({ error: "assetType is required" }, { status: 400 });
  }

  const { enabled } = getOpenAIConfig();

  if (!enabled) {
    return NextResponse.json(
      {
        error: "OPENAI_API_KEY is not configured",
        message: "Add OPENAI_API_KEY to .env.local to enable the Creative Director.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await runCreativePipeline(input);

    return NextResponse.json({
      ...result,
      model: getOpenAIConfig().model,
      imageModel: getOpenAIConfig().imageModel,
    });
  } catch (error) {
    console.error("Creative Director API failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Creative Director pipeline failed",
      },
      { status: 500 }
    );
  }
}
