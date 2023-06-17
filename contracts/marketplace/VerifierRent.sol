// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VerifierRent {
    uint256 constant chainId = 5;
    bytes32 constant salt =
        0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558;

    string private constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,bytes32 salt)";
    string private constant RENT_TYPE =
        "Rent(address offerer,uint pricePD,address token,uint id,uint minTime,uint maxTime,bytes32 salt)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));

    bytes32 private constant RENT_TYPEHASH =
        keccak256(abi.encodePacked(RENT_TYPE));

    bytes32 private constant DOMAIN_SEPARATOR =
        keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256("test"),
                keccak256("1"),
                chainId,
                salt
            )
        );

    struct Rent {
        address offerer;
        uint pricePD;
        address token;
        uint id;
        uint minTime;
        uint maxTime;
        bytes32 salt;
    }

    function hashRentDomain(Rent memory rent) private pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, _hashRent(rent))
            );
    }

    function _hashRent(Rent memory rent) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    RENT_TYPEHASH,
                    rent.offerer,
                    rent.pricePD,
                    rent.token,
                    rent.id,
                    rent.minTime,
                    rent.maxTime,
                    rent.salt
                )
            );
    }

    function verifyRent(
        address signer,
        Rent memory rent,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure virtual returns (bool) {
        return signer == ecrecover(hashRentDomain(rent), v, r, s);
    }
}
