/* eslint-disable jest/valid-expect */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { NFT, Marketplace } from "../typechain-types";
const { expect } = require("chai");
const { ethers } = require("hardhat");
import { HashZero } from "@ethersproject/constants";
import { arrayify, BytesLike, concat, hexlify } from "@ethersproject/bytes";

const address0 = "0x0000000000000000000000000000000000000000";

describe("NFT", function () {
  async function deployNFTFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const NFTFactory = await ethers.getContractFactory("NFT");
    const nft: NFT = await NFTFactory.deploy();

    await nft.deployed();

    await nft.setAdmin(owner.address, true);

    return { nft, owner, otherAccount };
  } 

  async function deployMarketplaceFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, weth] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("Marketplace");
    const marketplace: Marketplace = await Contract.deploy(weth.address);

    await marketplace.deployed();

    return { marketplace, owner, otherAccount };
  }

  it("should be deployed", async function () {
    const { nft, owner } = await loadFixture(deployNFTFixture);
    const { marketplace } = await loadFixture(deployMarketplaceFixture);

    const supply = await nft.totalSupply();
    const contractURI = await nft.contractURI();
    const ownerOfContract = await nft.owner();
    const ownerOfContractMarket = await marketplace.owner();

    expect(nft.address).to.be.properAddress;
    expect(marketplace.address).to.be.properAddress;
    expect(supply).to.eq(2000);
    // expect(contractURI).to.eq(
    //   "ipfs://Qmdf9A4JsqTydaucvGJ2V3GzsrW4XRLZENQTH2SQSQWkHZ"
    // );
    expect(ownerOfContract).to.eq(owner.address);
    expect(ownerOfContractMarket).to.eq(owner.address);
    console.log("address is valid");
  });

  it("mint", async function () {
    const { nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
    const address0 = "0x0000000000000000000000000000000000000000";
    const totalSupplyBefore = await nft.totalSupply();
    const numToMint = 30;

    const mintTx = await nft.mint(otherAccount.address, numToMint);

    await expect(mintTx)
      .to.emit(nft, "Transfer")
      .withArgs(
        address0,
        otherAccount.address,
        totalSupplyBefore.toNumber() + numToMint
      );

    const balanceNFT = await nft.balanceOf(otherAccount.address);
    const totalSupplyAfter = await nft.totalSupply();

    expect(balanceNFT).to.eq(numToMint);
    expect(totalSupplyAfter).to.eq(totalSupplyBefore.toNumber() + numToMint);

    //reverts

    await expect(
      nft.connect(otherAccount).mint(otherAccount.address, 1)
    ).to.be.revertedWith("Not Owner");
  });

  it("approve nft", async function () {
    const { nft, owner, otherAccount } = await loadFixture(deployNFTFixture);

    const approveTx = await nft.approve(otherAccount.address, 1623);

    await expect(approveTx)
      .to.emit(nft, "Approval")
      .withArgs(owner.address, otherAccount.address, 1623);

    const getApproveTx = await nft.getApproved(1623);

    expect(getApproveTx).to.eq(otherAccount.address);

    //reverts
    await expect(
      nft.connect(otherAccount).approve(otherAccount.address, 512)
    ).to.be.revertedWith(
      "ERC721: approve caller is not token owner or approved for all"
    );
  });

  it("approve all nft", async function () {
    const { nft, owner, otherAccount } = await loadFixture(deployNFTFixture);

    const approveAllTx = await nft.setApprovalForAll(
      otherAccount.address,
      true
    );

    await expect(approveAllTx)
      .to.emit(nft, "ApprovalForAll")
      .withArgs(owner.address, otherAccount.address, true);

    const getApproveAllTx = await nft.isApprovedForAll(
      owner.address,
      otherAccount.address
    );

    expect(getApproveAllTx).to.eq(true);
  });

  it("transfer nft", async function () {
    const { nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
    const address0 = "0x0000000000000000000000000000000000000000";
    const totalSupply: any = await nft.totalSupply();

    // await nft.approve(otherAccount.address, 1);

    const transferTx = await nft["safeTransferFrom(address,address,uint256)"](
      owner.address,
      otherAccount.address,
      1512
    );

    await expect(transferTx)
      .to.emit(nft, "Transfer")
      .withArgs(owner.address, otherAccount.address, 1512);

    const balanceOwner = await nft.balanceOf(owner.address);
    const balanceotherAccount = await nft.balanceOf(otherAccount.address);

    const ownerOfToken = await nft.ownerOf(1512);

    expect(balanceOwner).to.eq(totalSupply - 1);
    expect(balanceotherAccount).to.eq(1);
    expect(ownerOfToken).to.eq(otherAccount.address);

    //reverts
    await expect(
      nft
        .connect(otherAccount)
        ["safeTransferFrom(address,address,uint256)"](
          owner.address,
          otherAccount.address,
          1512
        )
    ).to.be.revertedWith("Not Admin");

    await nft.setAdmin(otherAccount.address, true);

    await expect(
      nft
        .connect(otherAccount)
        ["safeTransferFrom(address,address,uint256)"](
          owner.address,
          otherAccount.address,
          111
        )
    ).to.be.revertedWith("ERC721: caller is not token owner or approved");

    await expect(
      nft["safeTransferFrom(address,address,uint256)"](
        owner.address,
        address0,
        214
      )
    ).to.be.revertedWith("ERC721: transfer to the zero address");
  });

  it("transfer from nft", async function () {
    const { nft, owner, otherAccount } = await loadFixture(deployNFTFixture);

    const totalSupply: any = await nft.totalSupply();
    // await nft.approve(otherAccount.address, 1);
    await nft.setAdmin(otherAccount.address, true);
    await nft.setApprovalForAll(otherAccount.address, true);

    const transferTx = await nft
      .connect(otherAccount)
      ["safeTransferFrom(address,address,uint256)"](
        owner.address,
        otherAccount.address,
        412
      );

    await expect(transferTx)
      .to.emit(nft, "Transfer")
      .withArgs(owner.address, otherAccount.address, 412);

    const balanceOwner = await nft.balanceOf(owner.address);
    const balanceotherAccount = await nft.balanceOf(otherAccount.address);

    const onerOfToken = await nft.ownerOf(412);

    expect(balanceOwner).to.eq(totalSupply - 1);
    expect(balanceotherAccount).to.eq(1);
    expect(onerOfToken).to.eq(otherAccount.address);

    const transferTx2 = await nft
      .connect(otherAccount)
      .transferFrom(owner.address, otherAccount.address, 555);

    await expect(transferTx2)
      .to.emit(nft, "Transfer")
      .withArgs(owner.address, otherAccount.address, 555);

    const balanceOwner2 = await nft.balanceOf(owner.address);
    const balanceotherAccount2 = await nft.balanceOf(otherAccount.address);

    const onerOfToken2 = await nft.ownerOf(555);

    expect(balanceOwner2).to.eq(totalSupply - 2);
    expect(balanceotherAccount2).to.eq(2);
    expect(onerOfToken2).to.eq(otherAccount.address);

    //reverts
    await expect(
      nft
        .connect(otherAccount)
        ["safeTransferFrom(address,address,uint256)"](
          owner.address,
          address0,
          512
        )
    ).to.be.revertedWith("ERC721: transfer to the zero address");
  });

  it("change URIs", async function () {
    const { nft, owner, otherAccount } = await loadFixture(deployNFTFixture);

    const newUri = "newUri";
    const newContractUri = "newContractUri";

    await nft.changeBaseURI(newUri);
    await nft.changeBaseContractURI(newContractUri);

    const contractURI = await nft.contractURI();
    const tokenURI = await nft.tokenURI(555);

    expect(contractURI).to.eq(newContractUri);
    expect(tokenURI).to.eq(`${newUri}${555}.json`);

    await expect(nft.tokenURI(2222)).to.be.revertedWith("invalid token ID");

    //reverts
    await expect(
      nft.connect(otherAccount).changeBaseURI(newUri)
    ).to.be.revertedWith("Not Owner");

    await expect(
      nft.connect(otherAccount).changeBaseContractURI(newContractUri)
    ).to.be.revertedWith("Not Owner");
  });

  it("roles", async function () {
    const { nft, owner, otherAccount } = await loadFixture(deployNFTFixture);

    await expect(
      nft.connect(otherAccount).setAdmin(otherAccount.address, true)
    ).to.be.revertedWith("Not Owner");

    const adminTx = await nft.setAdmin(otherAccount.address, true);

    const isAdmin = await nft.getAdmin(otherAccount.address);

    const time = (await ethers.provider.getBlock(adminTx.blockNumber))
      .timestamp;

    await expect(adminTx)
      .to.emit(nft, "SetAdmin")
      .withArgs(otherAccount.address, true, time);

    expect(isAdmin).to.eq(true);

    const adminTx2 = await nft.setAdmin(otherAccount.address, false);

    const isAdmin2 = await nft.getAdmin(otherAccount.address);

    const time2 = (await ethers.provider.getBlock(adminTx2.blockNumber))
      .timestamp;

    await expect(adminTx2)
      .to.emit(nft, "SetAdmin")
      .withArgs(otherAccount.address, false, time2);

    expect(isAdmin2).to.eq(false);

    await expect(
      nft.connect(otherAccount).transferOwnership(otherAccount.address)
    ).to.be.revertedWith("Not Owner");

    const transferOwnerTx = await nft.transferOwnership(otherAccount.address);

    const isOwner = await nft.owner();

    await expect(transferOwnerTx)
      .to.emit(nft, "OwnershipTransferred")
      .withArgs(owner.address, otherAccount.address);

    expect(isOwner).to.eq(otherAccount.address);
  });

  it("rent", async () => {
    const { nft, owner, otherAccount } = await loadFixture(deployNFTFixture);

    let expires = Math.floor(new Date().getTime() / 1000) + 10000;
    await nft.setUser(1, otherAccount.address, BigInt(expires));

    let user_1 = await nft.userOf(1);
    expect(user_1).to.eq(otherAccount.address);

    let owner_1 = await nft.ownerOf(1);
    expect(owner_1).to.eq(owner.address);

    const notUser = await nft.userOf(2);
    expect(notUser).to.eq(address0);

    const exp = await nft.userExpires(1);
    expect(exp).to.eq(expires);

    const bytes = ethers.utils.toUtf8Bytes("4907");

    const in2 = hexlify(concat([bytes, HashZero]).slice(0, 4));

    const inter = await nft.supportsInterface(in2);

    expect(inter).to.eq(false);
  });









  it("market cancel order", async () => {
    const { marketplace, owner, otherAccount } = await loadFixture(deployMarketplaceFixture);

    
  });
});
