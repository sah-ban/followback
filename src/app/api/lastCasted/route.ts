import { NextRequest, NextResponse } from "next/server";

// Type Definitions
interface FollowMessage {
  data: {
    linkBody: {
      targetFid: number;
    };
  };
}

interface FollowApiResponse {
  messages: FollowMessage[];
}

interface SlimUser {
  timestamp: number;
  fid: number;
  username: string;
  pfp: string;
}
const hubUrl = process.env.HUB_URL;

// Helper: Fetch individual user details
async function fetchUserDetails(fid: number): Promise<SlimUser | null> {
  try {
    const [res1, res2] = await Promise.all([
      fetch(`${hubUrl}/v1/castsByFid?fid=${fid}&pageSize=1&reverse=true`),
      fetch(`${hubUrl}/v1/userDataByFid?fid=${fid}`),
    ]);

    if (!res1.ok) throw new Error("First API failed");

    const response1 = await res1.json();
    const time = response1?.messages?.[0]?.data?.timestamp ?? null;

    let username = "unknown";
    let pfp =
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/7df1c31c-5721-4d33-2d2c-a102a8b3ca00/original";

    if (res2.ok) {
      const response2 = await res2.json();
      const messages = response2?.messages || [];

      for (const msg of messages) {
        const type = msg?.data?.userDataBody?.type;
        const value = msg?.data?.userDataBody?.value;

        if (type === "USER_DATA_TYPE_USERNAME") {
          username = value;
        } else if (type === "USER_DATA_TYPE_PFP") {
          pfp = value;
        }
      }
    }

    return {
      timestamp: time,
      fid,
      username,
      pfp,
    };
  } catch (err) {
    console.error(`Failed to process user ${fid}`, err);
    return null;
  }
}

// Helper: Concurrency Pool
async function processInBatches(
  fids: number[],
  batchSize: number
): Promise<SlimUser[]> {
  const results: SlimUser[] = [];
  let i = 0;

  while (i < fids.length) {
    const batch = fids.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(fetchUserDetails));

    for (const result of settled) {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    }

    i += batchSize;
  }

  return results;
}

// Main Handler
export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");
  if (!fid) {
    return NextResponse.json(
      { error: "Missing fid parameter" },
      { status: 400 }
    );
  }

  const followingUrl = `${hubUrl}/v1/linksByFid?fid=${fid}`;

  try {
    const followingRes = await fetch(followingUrl);

    if (!followingRes.ok) {
      throw new Error("Failed to fetch following data");
    }

    const followingData: FollowApiResponse = await followingRes.json();

    const followingIds = [
      ...new Set(
        followingData.messages.map((msg) => msg.data.linkBody.targetFid)
      ),
    ];

    const details = await processInBatches(followingIds, 50); // Use 10 concurrent requests
    const inOrder = details.sort((a, b) => a.timestamp - b.timestamp);

    return NextResponse.json({ inOrder });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}
