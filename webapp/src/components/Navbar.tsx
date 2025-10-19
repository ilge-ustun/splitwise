import wagmiNetworks from "@/config/wagmiNetworks";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";

export default function Navbar() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const networks = Object.values(wagmiNetworks);

  const { open } = useAppKit();
  const { disconnectAsync } = useDisconnect();
  
  const handleChainChange = async ( 
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedChainId = parseInt(event.target.value);
    if (selectedChainId && selectedChainId !== chainId && switchChain) {
      await switchChain({ chainId: selectedChainId });
    }
  };

    const login = () => {
    open({ view: "Connect" });
  };

  const logout = async () => {
    try {
      await disconnectAsync();
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  return (
<nav className="bg-[#F4F7FC] rounded-xl p-4 mb-8 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="font-mono text-xl font-bold text-gray-800">
            Split3
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="chain-selector"
                className="text-sm font-medium text-gray-700"
              >
                Chain:
              </label>
              <select
                id="chain-selector"
                value={chainId}
                onChange={handleChainChange}
                className="chain-selector"
              >
                {networks?.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
              {address && (
                <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {address}
                </span>
              )}
            </div>
          )}
          {!isConnected ? (
            <button onClick={login} className="primary">
              Connect my wallet
            </button>
          ) : (
            <button onClick={logout} className="secondary">
              Disconnect
            </button>
          )}
        </div>
      </nav>)}