// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NFTMarketplaceModule = buildModule("NFTMarketplaceModule", (m) => {

  const nftMarketplace = m.contract("NFTMarketplace");
  
  return { nftMarketplace };
});

export default NFTMarketplaceModule;
