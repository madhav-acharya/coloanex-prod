// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract KYCRegistry {
    struct KYCRecord {
        string kycId;
        address user;
        string status;
        uint256 timestamp;
        string verifiedBy;
    }

    mapping(string => KYCRecord) public kycRecords;
    mapping(address => string[]) public userKYCs;

    event KYCVerified(
        string indexed kycId,
        address indexed user,
        string status,
        uint256 timestamp
    );

    event KYCStatusUpdated(
        string indexed kycId,
        string status,
        uint256 timestamp
    );

    function verifyKYC(
        string calldata kycId,
        address user,
        string calldata status,
        string calldata verifiedBy
    ) external {
        require(bytes(kycId).length > 0, "Invalid KYC ID");
        
        KYCRecord memory record = KYCRecord({
            kycId: kycId,
            user: user,
            status: status,
            timestamp: block.timestamp,
            verifiedBy: verifiedBy
        });

        kycRecords[kycId] = record;
        userKYCs[user].push(kycId);

        emit KYCVerified(kycId, user, status, block.timestamp);
    }

    function getKYC(string calldata kycId) external view returns (KYCRecord memory) {
        return kycRecords[kycId];
    }

    function updateKYCStatus(string calldata kycId, string calldata status) external {
        require(kycRecords[kycId].timestamp > 0, "KYC does not exist");
        kycRecords[kycId].status = status;
        kycRecords[kycId].timestamp = block.timestamp;
        emit KYCStatusUpdated(kycId, status, block.timestamp);
    }

    function getUserKYCs(address user) external view returns (string[] memory) {
        return userKYCs[user];
    }
}
