"use client";

import { useEffect, useCallback, useState } from "react";

import sdk, { type Context } from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useContractRead,
  useConnect,
} from "wagmi";
import { encodeFunctionData } from "viem";
import { abi } from "../contracts/abi";
import { config } from "~/components/providers/WagmiProvider";

import { BaseError, UserRejectedRequestError } from "viem";

import { WalletButton } from "./wallet";
import Loading from "./Loading";

export default function Demo() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [noOfMints, setNoOfMints] = useState(0);
  const { address: userAddress } = useAccount();
  const [activeDiv, setActiveDiv] = useState<"div1" | "div2">("div1");
  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });
  const { connect } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);

      sdk.actions.ready({});
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  interface User {
    fid: number;
    username: string;
    followingCount: string;
    followerCount: string;
    pfp: string;
  }
  interface Response {
    data: User[];
  }

  const [info, setInfo] = useState<Response | null>(null);
  const fetchFB = useCallback(async (fid: string) => {
    try {
      const res = await fetch(`/api/followBack?fid=${fid}`);
      if (!res.ok) {
        throw new Error(`Fid HTTP error! Status: ${res.status}`);
      }
      const responseData = await res.json();
      if (Array.isArray(responseData.users) && responseData.users.length >= 3) {
        setInfo({ data: responseData.users });
      } else {
        throw new Error("Invalid response structure or not enough data");
      }
    } catch (err) {
      console.error("Error fetching data from farcaster", err);
    }
  }, []);

  // const { address: userAddress } = useAccount();
  interface InactiveUser {
    fid: number;
    username: string;
    timestamp: number;
    pfp: string;
  }
  interface LResponse {
    Idata: InactiveUser[];
  }

  const [inactiveInfo, setInactiveInfo] = useState<LResponse | null>(null);
  const lastCasted = useCallback(async (fid: string) => {
    try {
      const res = await fetch(`/api/lastCasted?fid=${fid}`);
      if (!res.ok) {
        throw new Error(`Fid HTTP error! Status: ${res.status}`);
      }
      const responseData = await res.json();
      if (
        Array.isArray(responseData.inOrder) &&
        responseData.inOrder.length >= 3
      ) {
        setInactiveInfo({ Idata: responseData.inOrder });
      } else {
        throw new Error("Invalid response structure or not enough data");
      }
    } catch (err) {
      console.error("Error fetching data from farcaster", err);
    }
  }, []);

  useEffect(() => {
    if (context && noOfMints > 0) {
      fetchFB(String(context?.user.fid));
      lastCasted(String(context?.user.fid));
    }
  }, [context, isConfirmed, noOfMints]);

  const ADDRESS = "0x8277A3003127385Ca455B1898905b105556851d0";
  const sendTx = useCallback(() => {
    const data = encodeFunctionData({
      abi,
      functionName: "mintNFT",
      args: [],
    });
    sendTransaction(
      {
        to: ADDRESS,
        data,
        value: BigInt("500000000000000"), // 0.0005 ETH mint fee
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
      }
    );
    // setClaimStatus("All Done");
  }, [sendTransaction]);

  // Get the connected wallet address

  const { data } = useContractRead({
    address: ADDRESS,
    abi,
    functionName: "getMintedByAddress",
    args: [userAddress],
    chainId: 8453,
  });

  const count = data ? Number(data) : 0;

  useEffect(() => {
    if (count) {
      setNoOfMints(count);
    }
  }, [count]);

  function getTimeAgo(timestamp: number): string {
    if (!timestamp || typeof timestamp !== "number" || isNaN(timestamp)) {
      return "Never Casted";
    }

    const baseDate = new Date("2023-01-01T00:00:00Z"); // Farcaster epoch
    const past = new Date(baseDate.getTime() + timestamp * 1000);
    const now = new Date();

    let years = now.getFullYear() - past.getFullYear();
    let months = now.getMonth() - past.getMonth();
    let days = now.getDate() - past.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
    if (months > 0 || years > 0)
      parts.push(`${months} month${months > 1 ? "s" : ""}`);
    if (days > 0 || months > 0 || years > 0)
      parts.push(`${days} day${days > 1 ? "s" : ""}`);

    return parts.length > 0 ? parts.join(", ") + " ago" : "just now";
  }

  if (!context)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex flex-col items-center justify-center text-white text-2xl p-4">
          <p className="flex items-center justify-center text-center">
            you need to access this frame from inside a farcaster client
          </p>
        </div>
      </div>
    );

  if (noOfMints < 1)
    return (
      <div
        style={{
          paddingTop: context?.client.safeAreaInsets?.top ?? 0,
          paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
          paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
          paddingRight: context?.client.safeAreaInsets?.right ?? 0,
        }}
        className="flex flex-col bg-[#15202B] h-screen text-white items-center justify-center min-h-screen"
      >
        <WalletButton />
        <div className="p-4 text-base text-center max-w-[90%] mx-auto shadow-md">
          <p className="mb-2 font-semibold">
            You need to hold at least{" "}
            <span className="text-indigo-600">1 FollowBack NFT</span> to see who
            are inactive & not following you back!
          </p>
          <Mint />
        </div>
      </div>
    );

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
      className="max-h-screen overflow-y-auto shadow-lg"
    >
      <div className="container mx-auto text-center">
        <div className="flex justify-around sticky top-0 z-10 bg-white">
          <button
            onClick={() => setActiveDiv("div1")}
            className={`p-2 ${
              activeDiv === "div1"
                ? "border-b-4 border-sky-400 text-sky-400 font-bold"
                : ""
            }`}
          >
            Last Active
          </button>
          <button
            onClick={() => setActiveDiv("div2")}
            className={`p-2 ${
              activeDiv === "div2"
                ? "border-b-4 border-sky-400 text-sky-400 font-bold"
                : ""
            }`}
          >
            Not Following Back
          </button>
        </div>

        {activeDiv === "div1" && <Inactive />}

        {activeDiv === "div2" && <NotFollowing />}
      </div>
    </div>
  );

  function Mint() {
    const [isClicked, setIsClicked] = useState(false);

    // const CONTRACT_ADDRESS = "0x8018b9a2a4B9451128eF9740E445bd1E6C7fdf03";
    const handleMint = () => {
      setIsClicked(true);
      setTimeout(() => {
        if (!isConnected) {
          connect({ connector: config.connectors[0] });
        } else {
          sendTx();
        }
      }, 500);

      setTimeout(() => setIsClicked(false), 500); // Reset after animation
    };

    return (
      <div className="flex flex-col mt-2">
        <button
          onClick={handleMint}
          disabled={isSendTxPending}
          className="text-white text-center py-2 rounded-xl font-semibold text-lg shadow-lg relative overflow-hidden transform transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center gap-2"
          style={{
            background:
              "linear-gradient(90deg, #8B5CF6, #7C3AED, #A78BFA, #8B5CF6)",
            backgroundSize: "300% 100%",
            animation: "gradientAnimation 3s infinite ease-in-out",
          }}
        >
          <div
            className={`absolute inset-0 bg-[#38BDF8] transition-all duration-500 ${
              isClicked ? "scale-x-100" : "scale-x-0"
            }`}
            style={{ transformOrigin: "center" }}
          ></div>
          <style>{`
              @keyframes gradientAnimation {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
          {isConnected ? <MintButton /> : "Connect Wallet"}
        </button>
        <div className="text-center">
          {isSendTxError && renderError(sendTxError)}
        </div>
      </div>
    );
  }
  function MintButton() {
    return (
      <div className="flex flex-row gap-2 px-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 relative z-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
          />
        </svg>{" "}
        <span className="relative z-10">
          {" "}
          {isConfirming ? "Minting..." : isConfirmed ? "Minted" : `Mint`}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 relative z-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
          />
        </svg>{" "}
      </div>
    );
  }

  function NotFollowing() {
    return (
      <>
        {info?.data && info.data.length > 0 ? (
          <div>
            <table className="min-w-full divide-y divide-gray-700 text-sm text-white bg-[#1f2937]">
              <thead className="bg-[#111827] text-xs uppercase tracking-wider text-gray-300 sticky top-0 z-10">
                <tr></tr>
              </thead>

              <tbody className="divide-y divide-gray-600">
                {info?.data.map((user) => (
                  <tr key={user.fid} className="hover:bg-[#374151]">
                    <td className="px-4 py-2 text-center align-middle">
                      <div
                        className="flex items-center justify-center gap-3 cursor-pointer"
                        onClick={() =>
                          sdk.actions.viewProfile({ fid: user?.fid })
                        }
                      >
                        <img
                          src={user.pfp}
                          alt={`${user.username}'s profile`}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className="font-medium">@{user.username}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Loading />
        )}
      </>
    );
  }

  function Inactive() {
    return (
      <>
        {inactiveInfo?.Idata && inactiveInfo.Idata.length > 0 ? (
          <div>
            <table className="min-w-full divide-y divide-gray-700 text-sm text-white bg-[#1f2937]">
              <thead className="bg-[#111827] text-xs uppercase tracking-wider text-gray-300 sticky top-10 z-10">
                <tr>
                  <th className="px-4 py-2 text-center">Users</th>
                  <th className="px-4 py-2 text-center">Last Active</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-600">
                {inactiveInfo?.Idata.map((user) => (
                  <tr key={user.fid} className="hover:bg-[#374151]">
                    <td className="px-4 py-2">
                      <div
                        className="flex items-center gap-3"
                        onClick={() =>
                          sdk.actions.viewProfile({ fid: user?.fid })
                        }
                      >
                        <img
                          src={user.pfp}
                          alt={`${user.username}'s profile`}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className="font-medium">@{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {getTimeAgo(user.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Loading />
        )}
      </>
    );
  }
}
const renderError = (error: Error | null) => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection =
      error instanceof UserRejectedRequestError ||
      (error.cause && error.cause instanceof UserRejectedRequestError);

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};
