import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This endpoint is for debugging localStorage data from the frontend
    // Since localStorage is client-side only, this endpoint returns info about expected structure

    return Response.json({
      success: true,
      info: "This endpoint shows expected connection state structure",
      expectedStructure: {
        shopify_connection_state: {
          domain: "string",
          shopName: "string",
          isConnected: "boolean",
          lastSync: "string (ISO date)",
          productCount: "number - THIS IS KEY FIELD",
          knowledgeBaseId: "number (optional)",
          replicaUuid: "string (optional)",
          userId: "string (optional)",
          connectionTimestamp: "string (ISO date)",
          lastVerified: "string (ISO date, optional)"
        }
      },
      debugSteps: [
        "1. Open browser DevTools (F12)",
        "2. Go to Application > Local Storage > http://localhost:3000",
        "3. Find 'shopify_connection_state' key",
        "4. Check if productCount field exists and has value > 0",
        "5. If productCount is 0 or missing, sync data wasn't saved properly"
      ],
      troubleshooting: {
        issue: "productCount showing 0 in UI",
        possibleCauses: [
          "Connection state not saved after successful sync",
          "productCount field missing from saved data",
          "Browser localStorage cleared",
          "Data saved with wrong structure"
        ],
        solution: "Re-run sync to save proper data structure"
      }
    });

  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}