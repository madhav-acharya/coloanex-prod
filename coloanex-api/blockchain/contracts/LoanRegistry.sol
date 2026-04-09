// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LoanRegistry {
    struct Loan {
        string loanId;
        uint256 amount;
        uint256 interestRate;
        uint256 termMonths;
        address borrower;
        address lender;
        string status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(string => Loan) private loans;
    mapping(string => bool) private exists;

    event LoanCreated(
        string indexed loanId,
        uint256 amount,
        uint256 interestRate,
        uint256 termMonths,
        address indexed borrower,
        address indexed lender,
        uint256 timestamp
    );

    event LoanStatusUpdated(
        string indexed loanId,
        string oldStatus,
        string newStatus,
        uint256 timestamp
    );

    function createLoan(
        string calldata loanId,
        uint256 amount,
        uint256 interestRate,
        uint256 termMonths,
        address borrower,
        address lender
    ) external {
        require(!exists[loanId], "Loan already exists");
        loans[loanId] = Loan({
            loanId: loanId,
            amount: amount,
            interestRate: interestRate,
            termMonths: termMonths,
            borrower: borrower,
            lender: lender,
            status: "DRAFT",
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        exists[loanId] = true;
        emit LoanCreated(loanId, amount, interestRate, termMonths, borrower, lender, block.timestamp);
    }

    function updateLoanStatus(string calldata loanId, string calldata newStatus) external {
        require(exists[loanId], "Loan does not exist");
        string memory oldStatus = loans[loanId].status;
        loans[loanId].status = newStatus;
        loans[loanId].updatedAt = block.timestamp;
        emit LoanStatusUpdated(loanId, oldStatus, newStatus, block.timestamp);
    }

    function getLoan(string calldata loanId) external view returns (Loan memory) {
        require(exists[loanId], "Loan does not exist");
        return loans[loanId];
    }
}
