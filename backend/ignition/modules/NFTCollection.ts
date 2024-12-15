// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NFTCollectionModule = buildModule("NFTCollectionModule", (m) => {

  const nftCollection = m.contract("NFTCollection");
  
  return { nftCollection };
});

export default NFTCollectionModule;
