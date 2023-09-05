function parseSignature(signature) {
    var r = signature.substring(0, 64);
    var s = signature.substring(64, 128);
    var v = signature.substring(128, 130);

    return {
        r: "0x" + r,
        s: "0x" + s,
        v: parseInt(v, 16),
    };
}

async function getSignOrder(signer, order) {
    const orderTypes = [
        { name: "offerer", type: "address" },
        { name: "price", type: "uint256" },
        { name: "token", type: "address" },
        { name: "id", type: "uint256" },
        { name: "startTime", type: "uint256" },
        { name: "endTime", type: "uint256" },
        { name: "salt", type: "bytes32" },
    ];

    // const chainId = await signer.getChainId();

    const domainData = {
        name: "orders",
        version: "1",
        chainId: 1,
        salt: "0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558",
    };

    const types = {
        Order: orderTypes
    }

    const signature = await signer._signTypedData(domainData, types, order);
    const res = parseSignature(signature.substring(2));
    return res;
}


async function getSignRent(signer, rent) {

    const rentTypes = [
        { name: "offerer", type: "address" },
        { name: "pricePD", type: "uint256" },
        { name: "token", type: "address" },
        { name: "id", type: "uint256" },
        { name: "minTime", type: "uint256" },
        { name: "maxTime", type: "uint256" },
        { name: "saltRent", type: "bytes32" }
    ];

    const domainData = {
        name: "rents",
        version: "1",
        chainId: 1,
        salt: "0x526aeeff599cba16ffd0b92f14113f7c61925b76cc78ad576b3d48b2ad0139d3",
    };

    const types = {
        Rent: rentTypes
    }

    const signature = await signer._signTypedData(domainData, types, rent);
    const res = parseSignature(signature.substring(2));
    return res;
}

async function getSignAuction(signer, auction) {
    const auctionTypes = [
        { name: "offerer", type: "address" },
        { name: "startPrice", type: "uint256" },
        { name: "token", type: "address" },
        { name: "id", type: "uint256" },
        { name: "endTime", type: "uint256" },
        { name: "saltAuction", type: "bytes32" },
    ];

    const domainData = {
        name: "auctions",
        version: "1",
        chainId: 1,
        salt: "0x9b5d9024b4776e6b1ef4559e3bc38ff1c06fac3df8c901ca7e6bf64ff3ced083",
    };

    const types = {
        Auction: auctionTypes
    }

    const signature = await signer._signTypedData(domainData, types, auction);
    const res = parseSignature(signature.substring(2));
    return res;
}


async function getSignBid(signer, bid) {
    const bidTypes = [
        { name: "bidder", type: "address" },
        { name: "price", type: "uint256" },
        { name: "auction", type: "Auction" },
        { name: "saltBid", type: "bytes32" }
    ];

    const auctionTypes = [
        { name: "offerer", type: "address" },
        { name: "startPrice", type: "uint256" },
        { name: "token", type: "address" },
        { name: "id", type: "uint256" },
        { name: "endTime", type: "uint256" },
        { name: "saltAuction", type: "bytes32" }
    ];

    const domainData = {
        name: "auctions",
        version: "1",
        chainId: 1,
        salt: "0x9b5d9024b4776e6b1ef4559e3bc38ff1c06fac3df8c901ca7e6bf64ff3ced083",
    };

    const types = {
        Bid: bidTypes,
        Auction: auctionTypes
    }

    const signature = await signer._signTypedData(domainData, types, bid);

    const res = parseSignature(signature.substring(2));
    return res;
}

module.exports = { getSignOrder, getSignRent, getSignAuction, getSignBid }