// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TipMyArtModule = buildModule("TipMyArtModule", (m) => {

  const tipMyArt = m.contract("TipMyArt");
  
  return { tipMyArt };
});

export default TipMyArtModule;
