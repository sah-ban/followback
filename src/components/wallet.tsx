import {
  useAccount,
  useConnect,
  useDisconnect
} from "wagmi";
import { config } from "~/components/providers/WagmiProvider";
import { truncateAddress } from "~/lib/truncateAddress";


export const WalletButton: React.FC = () => {
          const { address, isConnected } = useAccount();
          
 const { disconnect } = useDisconnect();
  const { connect } = useConnect();

        return(
<div className="fixed top-4 right-4 z-10">
  <div
    className="flex items-center px-4 py-2 bg-[#836EF9] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105"
  >
    {!isConnected ? (
      <span className="flex items-center gap-2 text-sm font-medium"
      onClick={()=>connect({ connector: config.connectors[0] })}>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          ></path>
        </svg>
        Connect Wallet
      </span>
    ) : (
      <span className="text-sm font-mono"
       onClick={()=>disconnect()}>{truncateAddress(address||"address")}</span>
    )}
  </div>
</div>
        )
       }