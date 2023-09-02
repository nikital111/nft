// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VerifierRent {
    uint256 constant chainIdRent = 1337;
    bytes32 constant saltRent =
        0x526aeeff599cba16ffd0b92f14113f7c61925b76cc78ad576b3d48b2ad0139d3;

    string private constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,bytes32 salt)";
    string private constant RENT_TYPE =
        "Rent(address offerer,uint256 pricePD,address token,uint256 id,uint256 minTime,uint256 maxTime,bytes32 saltRent)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));

    bytes32 private constant RENT_TYPEHASH =
        keccak256(abi.encodePacked(RENT_TYPE));

    bytes32 private constant DOMAIN_SEPARATOR =
        keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256("rents"),
                keccak256("1"),
                chainIdRent,
                saltRent
            )
        );

    struct Rent {
        address offerer;
        uint256 pricePD;
        address token;
        uint256 id;
        uint256 minTime;
        uint256 maxTime;
        bytes32 saltRent;
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
                    rent.saltRent
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
