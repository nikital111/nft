/* eslint-disable jest/valid-expect */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { NFT, Marketplace } from "../typechain-types";
const { expect } = require("chai");
const { ethers } = require("hardhat");
import { HashZero } from "@ethersproject/constants";
import { arrayify, BytesLike, concat, hexlify } from "@ethersproject/bytes";
const {
  getSignOrder,
  getSignRent,
  getSignAuction,
  getSignBid,
} = require("./shared/getSignature.js");

const address0 = "0x0000000000000000000000000000000000000000";

describe("Marketplace", function () {
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
    const [owner, otherAccount] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("Marketplace");
    const marketplace: Marketplace = await Contract.deploy();

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

  it("verify order", async function () {
    const { nft } = await loadFixture(deployNFTFixture);
    const { marketplace, owner, otherAccount } = await loadFixture(
      deployMarketplaceFixture
    );

    const tokenId1 = 164;
    const tokenId2 = 831;

    await nft.setAdmin(marketplace.address, true);

    let order = {
      offerer: owner.address,
      price: "100000000",
      token: nft.address,
      id: tokenId1,
      startTime: 1692730503,
      endTime: 1692989703,
      salt: "0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558",
    };

    const { r, s, v } = await getSignOrder(owner, order);

    const isVer = await marketplace.verifyOrder(owner.address, order, v, r, s);
    expect(isVer).to.eq(true);

    expect(await nft.ownerOf(tokenId1)).to.eq(owner.address);

    nft.approve(marketplace.address, tokenId1);

    await expect(
      marketplace.connect(otherAccount).validateAndFill(order, v, r, s)
    ).to.be.revertedWith("Marketplace: value");

    const tx = await marketplace
      .connect(otherAccount)
      .validateAndFill(order, v, r, s, { value: order.price });

    await expect(tx).to.changeEtherBalances(
      [otherAccount.address, owner.address],
      [-order.price, +order.price - (+order.price * 10) / 100]
    );

    await expect(tx).to.emit(marketplace, "OrderFilled");

    expect(await nft.ownerOf(tokenId1)).to.eq(otherAccount.address);

    await expect(
      marketplace
        .connect(otherAccount)
        .validateAndFill(order, v, r, s, { value: order.price })
    ).to.be.revertedWith("Marketplace: filled");

    await expect(marketplace.cancel(order)).to.be.revertedWith(
      "Marketplace: offerer || filled"
    );
  });

  it("cancel order", async function () {
    const { nft } = await loadFixture(deployNFTFixture);
    const { marketplace, owner, otherAccount } = await loadFixture(
      deployMarketplaceFixture
    );

    const tokenId1 = 164;
    const tokenId2 = 831;

    await nft.setAdmin(marketplace.address, true);

    let order = {
      offerer: owner.address,
      price: "200000000",
      token: nft.address,
      id: tokenId2,
      startTime: 1692730503,
      endTime: 1692989703,
      salt: "0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558",
    };

    const { r, s, v } = await getSignOrder(owner, order);

    await expect(
      marketplace.connect(otherAccount).cancel(order)
    ).to.be.revertedWith("Marketplace: offerer || filled");

    const tx = await marketplace.cancel(order);

    await expect(tx).to.emit(marketplace, "OrderCancelled");

    await expect(
      marketplace.validateAndFill(order, v, r, s, { value: order.price })
    ).to.be.revertedWith("Marketplace: canceled");
  });

  it("verify rent", async function () {
    const { nft } = await loadFixture(deployNFTFixture);
    const { marketplace, owner, otherAccount } = await loadFixture(
      deployMarketplaceFixture
    );

    const tokenId1 = 164;
    const tokenId2 = 831;

    await nft.setAdmin(marketplace.address, true);

    let rent = {
      offerer: owner.address,
      pricePD: "100000000",
      token: nft.address,
      id: tokenId1,
      minTime: 1,
      maxTime: 5,
      saltRent:
        "0x526aeeff599cba16ffd0b92f14113f7c61925b76cc78ad576b3d48b2ad0139d3",
    };

    const { r, s, v } = await getSignRent(owner, rent);

    const isVer = await marketplace.verifyRent(owner.address, rent, v, r, s);
    expect(isVer).to.eq(true);

    expect(await nft.userOf(tokenId1)).to.eq(address0);

    nft.approve(marketplace.address, tokenId1);

    await expect(
      marketplace
        .connect(otherAccount)
        .validateAndFillRent(rent, rent.minTime, v, r, s)
    ).to.be.revertedWith("Marketplace: value");

    const tx = await marketplace
      .connect(otherAccount)
      .validateAndFillRent(rent, rent.minTime, v, r, s, {
        value: +rent.pricePD * rent.minTime,
      });

    await expect(tx).to.changeEtherBalances(
      [otherAccount.address, owner.address],
      [
        -rent.pricePD * rent.minTime,
        +rent.pricePD * rent.minTime -
          (+rent.pricePD * rent.minTime * 10) / 100,
      ]
    );

    await expect(tx).to.emit(marketplace, "RentFilled");

    expect(await nft.userOf(tokenId1)).to.eq(otherAccount.address);

    await expect(
      marketplace
        .connect(otherAccount)
        .validateAndFillRent(rent, rent.minTime, v, r, s, {
          value: +rent.pricePD * rent.minTime,
        })
    ).to.be.revertedWith("Marketplace: filled");

    await expect(marketplace.cancelRent(rent)).to.be.revertedWith(
      "Marketplace: offerer || filled"
    );
  });

  it("cancel rent", async function () {
    const { nft } = await loadFixture(deployNFTFixture);
    const { marketplace, owner, otherAccount } = await loadFixture(
      deployMarketplaceFixture
    );

    const tokenId1 = 164;
    const tokenId2 = 831;

    await nft.setAdmin(marketplace.address, true);

    let rent = {
      offerer: owner.address,
      pricePD: "100000000",
      token: nft.address,
      id: tokenId1,
      minTime: 1,
      maxTime: 5,
      saltRent:
        "0x526aeeff599cba16ffd0b92f14113f7c61925b76cc78ad576b3d48b2ad0139d3",
    };

    const { r, s, v } = await getSignRent(owner, rent);

    await expect(
      marketplace.connect(otherAccount).cancelRent(rent)
    ).to.be.revertedWith("Marketplace: offerer || filled");

    const tx = await marketplace.cancelRent(rent);

    await expect(tx).to.emit(marketplace, "RentCancelled");

    await expect(
      marketplace.validateAndFillRent(rent, rent.minTime, v, r, s, {
        value: +rent.pricePD * rent.minTime,
      })
    ).to.be.revertedWith("Marketplace: canceled");
  });

  it.only("verify auction", async function () {
    const { nft } = await loadFixture(deployNFTFixture);
    const { marketplace, owner, otherAccount } = await loadFixture(
      deployMarketplaceFixture
    );

    const tokenId1 = 164;
    const tokenId2 = 831;

    await nft.setAdmin(marketplace.address, true);

    let auction = {
      offerer: owner.address,
      startPrice: "100000000",
      token: nft.address,
      id: tokenId1,
      endTime: 1692989703,
      saltAuction:
        "0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558",
    };

    const { r, s, v } = await getSignAuction(owner, auction);

    const isVer = await marketplace.verifyAuction(
      owner.address,
      auction,
      v,
      r,
      s
    );
    expect(isVer).to.eq(true);

    let bid = {
      bidder: owner.address,
      price: "100000000",
      auction: auction,
      saltBid:
        "0x9b5d9024b4776e6b1ef4559e3bc38ff1c06fac3df8c901ca7e6bf64ff3ced083",
    };

    const { r: rB, s: sB, v: vB } = await getSignBid(owner, bid);


    const isVerB = await marketplace.verifyBid(owner.address, bid, vB, rB, sB);
    expect(isVerB).to.eq(true);
  });
});
