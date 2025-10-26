import { NextResponse } from "next/server";

export async function GET() {

    return NextResponse.json({
        name: `Follow Back Pass`,
        description: "Pass for checking who is not following you back on farcaster",
        image: `https://follow-back-checker.vercel.app/nft.png`,
        attributes: [],
    });
}
