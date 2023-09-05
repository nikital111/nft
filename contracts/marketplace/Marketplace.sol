// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import "./VerifierOrder.sol";
import "./VerifierRent.sol";
import "./VerifierAuction.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Roles.sol";
import "../nft.sol";

contract Marketplace is VerifierOrder, VerifierRent, VerifierAuction, ReentrancyGuard, Roles {
    event OrderCancelled(bytes32 orderHash, address offerer);
    event OrderFilled(bytes32 orderHash, address filler);
    event RentCancelled(bytes32 rentHash, address offerer);
    event RentFilled(bytes32 rentHash, address filler);
    struct StatusOrder {
        bool canceled;
        bool filled;
    }
    uint period = 1 days;
    uint fee = 10;
    mapping(bytes32 => Order) orders;
    mapping(bytes32 => StatusOrder) ordersStatus;

    function cancelRent(Rent calldata rent) external nonReentrant {
        _cancelRent(rent);
    }

    function validateAndFillRent(
        Rent calldata rent,
        uint duration,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable nonReentrant {
        require(verifyRent(rent.offerer, rent, v, r, s), "Marketplace: verify");
        bytes32 rentHash = _hashRent(rent);
        StatusOrder storage rentStatus = ordersStatus[rentHash];
        _validateRent(rent, duration, rentStatus);
        _fillRent(rent, duration);

        rentStatus.filled = true;

        emit RentFilled(rentHash, msg.sender);
    }

    function validateAndFill(
        Order calldata order,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable nonReentrant {
        require(
            verifyOrder(order.offerer, order, v, r, s),
            "Marketplace: verify"
        );
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
        require(!orderStatus.canceled, "Marketplace: canceled");
        require(!orderStatus.filled, "Marketplace: filled");
        require(msg.value >= order.price, "Marketplace: value");
        require(
            order.startTime <= block.timestamp &&
                order.endTime <= block.timestamp,
            "Marketplace: time"
        );
    }

    function _fill(Order calldata order) private {
        uint _fee = (order.price * fee) / 100;
        uint amountAfterFee = order.price - _fee;
        payable(order.offerer).transfer(amountAfterFee);
        if (msg.value > order.price) {
            payable(msg.sender).transfer(msg.value - order.price);
        }
        NFT(order.token).transferFrom(order.offerer, msg.sender, order.id);
    }

    function _cancel(Order calldata order) internal {
        bytes32 orderHash = _hashOrder(order);
        StatusOrder storage orderStatus = ordersStatus[orderHash];
        if (order.offerer != msg.sender || orderStatus.filled) {
            revert("Marketplace: offerer || filled");
        }

        orderStatus.canceled = true;

        emit OrderCancelled(orderHash, msg.sender);
    }

    function _validateRent(
        Rent calldata rent,
        uint duration,
        StatusOrder memory rentStatus
    ) private {
        require(!rentStatus.canceled, "Marketplace: canceled");
        require(!rentStatus.filled, "Marketplace: filled");
        require(msg.value >= rent.pricePD * duration, "Marketplace: value");
        require(
            duration >= rent.minTime && duration <= rent.maxTime,
            "Marketplace: time"
        );
    }

    function _fillRent(Rent calldata rent, uint duration) private {
        uint amount = rent.pricePD * duration;

        uint _fee = (amount * fee) / 100;
        uint amountAfterFee = amount - _fee;

        payable(rent.offerer).transfer(amountAfterFee);
        if (msg.value > amount) {
            payable(msg.sender).transfer(msg.value - amount);
        }
        NFT(rent.token).setUser(
            rent.id,
            msg.sender,
            uint64(block.timestamp + period * duration)
        );
    }

    function _cancelRent(Rent calldata rent) internal {
        bytes32 rentHash = _hashRent(rent);
        StatusOrder storage rentStatus = ordersStatus[rentHash];
        if (rent.offerer != msg.sender || rentStatus.filled) {
            revert("Marketplace: offerer || filled");
        }

        rentStatus.canceled = true;

        emit RentCancelled(rentHash, msg.sender);
    }
}
