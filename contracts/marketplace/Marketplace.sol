// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import "./VerifierOrder.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Roles.sol";
import "../nft.sol";

contract Marketplace is VerifierOrder, ReentrancyGuard, Roles {
    event OrderCancelled(bytes32 orderHash, address offerer);
    event OrderFilled(bytes32 orderHash, address filler);

    struct StatusOrder {
        bool canceled;
        bool filled;
    }
    uint fee = 10;
    mapping(bytes32 => Order) orders;
    mapping(bytes32 => StatusOrder) ordersStatus;

    function validateAndFill(
        Order calldata order,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable nonReentrant {
        require(verifyOrder(order.offerer, order, v, r, s));
        bytes32 orderHash = _hashOrder(order);
        StatusOrder storage orderStatus = ordersStatus[orderHash];
        _validate(order, orderStatus);
        _fill(order);

        orderStatus.filled = true;

        emit OrderFilled(orderHash, msg.sender);
    }

    function cancel(Order calldata order) external nonReentrant {
        _cancel(order);
    }

    function setFee(uint _fee) external onlyOwner {
        fee = _fee;
    }

    function _validate(
        Order calldata order,
        StatusOrder memory orderStatus
    ) private {
        require(!orderStatus.canceled);
        require(!orderStatus.filled);
        require(msg.value >= order.price);
        require(
            order.startTime <= block.timestamp &&
                order.endTime <= block.timestamp
        );
    }

    function _fill(Order calldata order) private {
        uint amountWithFee = (order.price * fee) / 100;
        payable(order.offerer).transfer(amountWithFee);
        if (msg.value > order.price) {
            payable(msg.sender).transfer(msg.value - order.price);
        }
        NFT(order.token).transferFrom(order.offerer, msg.sender, order.id);
    }

    function _cancel(Order calldata order) internal {
        bytes32 orderHash = _hashOrder(order);
        StatusOrder storage orderStatus = ordersStatus[orderHash];
        if (order.offerer != msg.sender || orderStatus.filled) {
            revert();
        }

        orderStatus.canceled = true;

        emit OrderCancelled(orderHash, msg.sender);
    }
}
