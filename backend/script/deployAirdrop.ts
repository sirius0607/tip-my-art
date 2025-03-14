import { ethers } from "hardhat";
import { ERC20Airdrop } from "../typechain-types";

async function main() {

  // 0x9F83899963C1C5392cbC354DBa6e0831b0bC77A8
  const airdropAddress: any = process.env[`AIRDROP_CONTRACT_ADDRESS`];
  const [account1, accountBlast] = await ethers.getSigners();
  const tipMyArtTokenAddress: any = process.env[`TIP_MY_ART_TOKEN_ADDRESS`];
  const tipMyArtToken = await ethers.getContractAt("TipMyArt", tipMyArtTokenAddress);

  // Deploy Airdrop contract
  //const AirdropFactory = await ethers.getContractFactory("ERC20Airdrop");
  //const airdrop: ERC20Airdrop = await AirdropFactory.deploy(tipMyArtToken.target);
  //await airdrop.waitForDeployment();

  const airdrop = await ethers.getContractAt("ERC20Airdrop", airdropAddress);

  console.log('owner initial balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(accountBlast.address)));
  console.log('airdrop initial balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(airdrop.target)));
  
  //const ownerBalance = await tipMyArtToken.balanceOf(accountBlast);
  // initialize airdrop with 899000 tokens
  //await tipMyArtToken.connect(accountBlast).transfer(airdrop.target, ethers.parseEther("899000"));

  console.log('TipMyArt address: ' + tipMyArtToken.target);
  console.log('Airdrop address: ' + airdrop.target);
  console.log('final airdrop balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(airdrop.target)));
  console.log('owner final balance: ', ethers.formatEther(await tipMyArtToken.balanceOf(accountBlast.address)));
}

main();