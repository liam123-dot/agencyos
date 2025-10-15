import { NextRequest, NextResponse } from "next/server";
import { generateConnectToken } from "./pipedream-actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId } = body;

    console.log("API Route: Received request for clientId:", clientId);

    const result = await generateConnectToken(clientId);

    console.log("API Route: Token generation result:", {
      success: result.success,
      hasToken: !!result.token,
      tokenPreview: result.token ? `${result.token.substring(0, 10)}...` : 'none',
      error: result.error,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    const response = {
      token: result.token,
      expiresAt: result.expiresAt,
      connectLinkUrl: result.connectLinkUrl,
      clientId: result.clientId,
    };

    console.log("API Route: Sending response with token:", {
      hasToken: !!response.token,
      tokenLength: response.token?.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in connect token route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

