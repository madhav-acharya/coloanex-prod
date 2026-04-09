// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaymentRegistry {
    struct Payment {
        string paymentId;
        string contractId;
        uint256 amount;
        string paymentMethod;
        string gatewayRef;
        uint256 timestamp;
    }

    mapping(string => Payment) private payments;
    mapping(string => bool) private exists;

    event PaymentRecorded(
        string indexed paymentId,
        string indexed contractId,
        uint256 amount,
        string paymentMethod,
        string gatewayRef,
        uint256 timestamp
    );

    function recordPayment(
        string calldata paymentId,
        string calldata contractId,
        uint256 amount,
        string calldata paymentMethod,
        string calldata gatewayRef
    ) external {
        require(!exists[paymentId], "Payment already recorded");
        payments[paymentId] = Payment({
            paymentId: paymentId,
            contractId: contractId,
            amount: amount,
            paymentMethod: paymentMethod,
            gatewayRef: gatewayRef,
            timestamp: block.timestamp
        });
        exists[paymentId] = true;
        emit PaymentRecorded(paymentId, contractId, amount, paymentMethod, gatewayRef, block.timestamp);
    }

    function getPayment(string calldata paymentId) external view returns (Payment memory) {
        require(exists[paymentId], "Payment does not exist");
        return payments[paymentId];
    }
}
