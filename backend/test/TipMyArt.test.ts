import {
  loadFixture
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("TipMyArt", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const TipMyArt = await ethers.getContractFactory("TipMyArt");
    const tipMyArt = await TipMyArt.deploy();

    return { tipMyArt, owner, otherAccount };
  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { tipMyArt, owner } = await loadFixture(deployFixture);

      expect(await tipMyArt.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint more tokens", async function () {

      const { tipMyArt, owner } = await loadFixture(deployFixture);
      const _initial_supply = ethers.parseEther("1000");

      const mintAmount = ethers.parseEther("100");
      // owner mint 100 more tokens to his address
      // a Transfert event is fired
      // from zeroAddress, to owner address, with mintAmount
      // from zeroAddress indicates a creation
      await expect(tipMyArt.connect(owner).mint(owner.address, mintAmount))
        .to.emit(tipMyArt, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, mintAmount)

      // _initial_supply is given to the owner in the constructor
      expect(await tipMyArt.balanceOf(owner.address)).to.equal(mintAmount + _initial_supply);
    });

    it("Should revert with custom error when non-owner tries to mint", async function () {

      const { tipMyArt, otherAccount } = await loadFixture(deployFixture);

      const mintAmount = ethers.parseEther("100");

      // Ownable.sol line 65
      await expect(tipMyArt.connect(otherAccount).mint(otherAccount.address, mintAmount))
        .to.be.revertedWithCustomError(tipMyArt, "OwnableUnauthorizedAccount")
        .withArgs(otherAccount.address);
    });
  });
});
