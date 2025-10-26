import { NextRequest, NextResponse } from "next/server";

interface FollowMessage {
  data: {
    linkBody: {
      targetFid: number;
    };
  };
}

interface FollowerMessage {
  data: {
    fid: number;
  };
}

interface FollowApiResponse {
  messages: FollowMessage[];
}

interface FollowerApiResponse {
  messages: FollowerMessage[];
}

interface SlimUser {
  fid: number;
  username: string;

  pfp: string;
}

// Fetch single user data
async function fetchUser(fid: number): Promise<SlimUser | null> {
  try {
    const res = await fetch(`https://hub.merv.fun/v1/userDataByFid?fid=${fid}`);
    if (!res.ok) throw new Error("User fetch failed");

    const response = await res.json();
    const messages = response?.messages || [];

    let username = "unknown";
    let pfp = "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/7df1c31c-5721-4d33-2d2c-a102a8b3ca00/original";

    for (const msg of messages) {
      const type = msg?.data?.userDataBody?.type;
      const value = msg?.data?.userDataBody?.value;

      if (type === "USER_DATA_TYPE_USERNAME") {
        username = value;
      } else if (type === "USER_DATA_TYPE_PFP") {
        pfp = value;
      }
    }

    return {
      fid,
      username,
      pfp,
    };
  } catch (err) {
    console.error(`Failed to fetch user ${fid}`, err);
    return null;
  }
}

// Concurrency helper
async function fetchInBatches(fids: number[], batchSize: number): Promise<SlimUser[]> {
  const result: SlimUser[] = [];

  for (let i = 0; i < fids.length; i += batchSize) {
    const batch = fids.slice(i, i + batchSize);
    const responses = await Promise.allSettled(batch.map(fetchUser));

    for (const res of responses) {
      if (res.status === "fulfilled" && res.value) {
        result.push(res.value);
      }
    }
  }

  return result;
}

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");
  if (!fid) {
    return NextResponse.json({ error: "Missing fid parameter" }, { status: 400 });
  }
const hubUrl= process.env.HUB_URL
   const followingUrl = `${hubUrl}/v1/linksByFid?fid=${fid}`;
  const followersUrl = `${hubUrl}/v1/linksByTargetFid?target_fid=${fid}&link_type=follow`;

  try {
    const [followingRes, followersRes] = await Promise.all([
      fetch(followingUrl),
      fetch(followersUrl),
    ]);

    if (!followingRes.ok || !followersRes.ok) {
      throw new Error("Failed to fetch follower/following data");
    }

    const followingData: FollowApiResponse = await followingRes.json();
    const followersData: FollowerApiResponse = await followersRes.json();

    const followingIds = new Set(
      followingData.messages.map((msg) => msg.data.linkBody.targetFid)
    );
    const followerIds = new Set(
      followersData.messages.map((msg) => msg.data.fid)
    );

    const notFollowingBack = Array.from(followingIds).filter(
      (fid) => !followerIds.has(fid)
    );

    // Fetch user data with concurrency
    const userDetails = await fetchInBatches(notFollowingBack, 50);

    // console.log(userDetails.map((u, i) => `${i + 1}. @${u.username}`).join('\n'));

    return NextResponse.json({ users: userDetails });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch unfollower details" }, { status: 500 });
  }
}
