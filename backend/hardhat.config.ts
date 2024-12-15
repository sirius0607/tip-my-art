import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_TESTNET_RPC_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY, process.env.ACCOUNT2_PRIVATE_KEY]
    }
  }
};

export default config;
