// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VerifierOrder {
    uint256 constant chainId = 1;
    bytes32 constant salt =
        0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558;

    string private constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,bytes32 salt)";
    string private constant ORDER_TYPE =
        "Order(address offerer,uint256 price,address token,uint256 id,uint256 startTime,uint256 endTime,bytes32 salt)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));

    bytes32 private constant ORDER_TYPEHASH =
        keccak256(abi.encodePacked(ORDER_TYPE));

    bytes32 private constant DOMAIN_SEPARATOR =
        keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256("orders"),
                keccak256("1"),
                chainId,
                salt
            )
        );

    struct Order {
        address offerer;
        uint256 price;
        address token;
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        bytes32 salt;
    }

    function hashOrderDomain(
        Order memory order
    ) private pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    DOMAIN_SEPARATOR,
                    _hashOrder(order)
                )
            );
    }

    function _hashOrder(Order memory order) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    ORDER_TYPEHASH,
                    order.offerer,
                    order.price,
                    order.token,
                    order.id,
                    order.startTime,
                    order.endTime,
                    order.salt
                )
            );
    }

    function verifyOrder(
        address signer,
        Order memory order,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure virtual returns (bool) {
        return signer == ecrecover(hashOrderDomain(order), v, r, s);
    }
}
