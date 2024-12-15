import { useAccount } from "wagmi";

const Body = () => {
    const { isConnected, address } = useAccount();
    return (
        <div className="p-5 grow flex flex-col items-center justify-center">
            {isConnected ? (
                <div className="text-center text-2xl text-white">
                    Accound address = {address}
                </div>
            ) : (
                <div className="text-center text-2xl text-white">Please connect your wallet to interact with the app.</div>
            )
            }
        </div>
    )
}

export default Body