// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import "./Verifier.sol";
import "../utils/ReentrancyGuard.sol";

contract Marketplace is Verifier, ReentrancyGuard {
    event SetAdmin(address indexed user, bool isAdmin, uint256 date);
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
    ) external payable nonReentrant returns (bool) {
        require(verifyOrder(order.offerer, order, v, r, s));
        bytes32 orderHash = _hashOrder(order);
        StatusOrder storage orderStatus = ordersStatus[orderHash];
        _validate(order, orderStatus);
        _fill(order);

        orderStatus.filled = true;

        emit OrderFilled(orderHash, msg.sender);
        return true;
    }

    function cancel(Order calldata order) external nonReentrant returns (bool cancelled) {
        cancelled = _cancel(order);
    }

    function _validate(
        Order calldata order,
        StatusOrder storage orderStatus
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
    }

    function _cancel(Order calldata order) internal returns (bool cancelled) {
        bytes32 orderHash = _hashOrder(order);
        StatusOrder storage orderStatus = ordersStatus[orderHash];
        if (order.offerer != msg.sender || orderStatus.filled) {
            revert();
        }

        orderStatus.canceled = true;

        emit OrderCancelled(orderHash, msg.sender);

        return true;
    }
}
