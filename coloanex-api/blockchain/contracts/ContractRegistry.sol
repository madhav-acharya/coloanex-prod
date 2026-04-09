// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ContractRegistry {
    struct LoanContract {
        string contractId;
        string loanId;
        uint256 loanAmount;
        uint256 interestRate;
        uint256 termMonths;
        uint256 totalAmountDue;
        bool signed;
        uint256 createdAt;
        uint256 signedAt;
    }

    mapping(string => LoanContract) private contracts;
    mapping(string => bool) private exists;

    event ContractCreated(
        string indexed contractId,
        string loanId,
        uint256 loanAmount,
        uint256 totalAmountDue,
        uint256 timestamp
    );

    event ContractSigned(
        string indexed contractId,
        uint256 timestamp
    );

    event ContractStatusUpdated(
        string indexed contractId,
        string status,
        uint256 timestamp
    );

    function createContract(
        string calldata contractId,
        string calldata loanId,
        uint256 loanAmount,
        uint256 interestRate,
        uint256 termMonths,
        uint256 totalAmountDue
    ) external {
        require(!exists[contractId], "Contract already exists");
        contracts[contractId] = LoanContract({
            contractId: contractId,
            loanId: loanId,
            loanAmount: loanAmount,
            interestRate: interestRate,
            termMonths: termMonths,
            totalAmountDue: totalAmountDue,
            signed: false,
            createdAt: block.timestamp,
            signedAt: 0
        });
        exists[contractId] = true;
        emit ContractCreated(contractId, loanId, loanAmount, totalAmountDue, block.timestamp);
    }

    function signContract(string calldata contractId) external {
        require(exists[contractId], "Contract does not exist");
        require(!contracts[contractId].signed, "Contract already signed");
        contracts[contractId].signed = true;
        contracts[contractId].signedAt = block.timestamp;
        emit ContractSigned(contractId, block.timestamp);
    }

    function updateContractStatus(string calldata contractId, string calldata status) external {
        require(exists[contractId], "Contract does not exist");
        emit ContractStatusUpdated(contractId, status, block.timestamp);
    }

    function getContract(string calldata contractId) external view returns (LoanContract memory) {
        require(exists[contractId], "Contract does not exist");
        return contracts[contractId];
    }
}
