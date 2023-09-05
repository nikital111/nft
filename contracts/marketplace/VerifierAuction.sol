// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VerifierAuction {
    uint256 constant chainIdAuction = 1;
    bytes32 constant saltAuction =
        0x9b5d9024b4776e6b1ef4559e3bc38ff1c06fac3df8c901ca7e6bf64ff3ced083;

    string private constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,bytes32 salt)";
    string private constant AUCTION_TYPE =
        "Auction(address offerer,uint256 startPrice,address token,uint256 id,uint256 endTime,bytes32 saltAuction)";

    string private constant BID_TYPE =
        "Bid(address bidder,uint256 price,Auction auction,bytes32 saltBid)Auction(address offerer,uint256 startPrice,address token,uint256 id,uint256 endTime,bytes32 saltAuction)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));

    bytes32 private constant AUCTION_TYPEHASH =
        keccak256(abi.encodePacked(AUCTION_TYPE));

    bytes32 private constant BID_TYPEHASH =
        keccak256(abi.encodePacked(BID_TYPE));

    bytes32 private constant DOMAIN_SEPARATOR =
        keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256("auctions"),
                keccak256("1"),
                chainIdAuction,
                saltAuction
            )
        );

    struct Auction {
        address offerer;
        uint256 startPrice;
        address token;
        uint256 id;
        uint256 endTime;
        bytes32 saltAuction;
    }

    struct Bid {
        address bidder;
        uint256 price;
        Auction auction;
        bytes32 saltBid;
    }

    function hashAuctionDomain(Auction memory auction) private pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, _hashAuction(auction))
            );
    }

    function hashBidDomain(Bid memory bid) private pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, _hashBid(bid))
            );
    }

    function _hashAuction(Auction memory auction) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    AUCTION_TYPEHASH,
                    auction.offerer,
                    auction.startPrice,
                    auction.token,
                    auction.id,
                    auction.endTime,
                    auction.saltAuction
                )
            );
    }

    function _hashBid(Bid memory bid) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    BID_TYPEHASH,
                    bid.bidder,
                    bid.price,
                    _hashAuction(bid.auction),
                    bid.saltBid
                )
            );
    }

    function verifyAuction(
        address signer,
        Auction memory auction,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure virtual returns (bool) {
        return signer == ecrecover(hashAuctionDomain(auction), v, r, s);
    }


    function verifyBid(
        address signer,
        Bid memory bid,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure virtual returns (bool) {
        return signer == ecrecover(hashBidDomain(bid), v, r, s);
    }
}
