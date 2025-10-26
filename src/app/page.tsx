import { Metadata } from "next";
import App from "~/app/app";

const appUrl = process.env.NEXT_PUBLIC_URL;

export const revalidate = 300;


export async function generateMetadata(): Promise<Metadata> {
  
  
  const frame = {
    version: "next",
    imageUrl:`${appUrl}/og.png`,
        button: {
          title:"Check",
    action: {
      type: "launch_frame",
      name: "FollowBack",
      url: `${appUrl}`,
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#FFFFFF",
      },
    },
  };

  return {
    title: "Follow Back Checker",
    openGraph: {
      title: "Follow Back Checker",
      description: "Follow Back Checker on Farcaster",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return (<App />);
}


