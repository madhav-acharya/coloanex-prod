// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RuleRegistry {
    struct Rule {
        string ruleId;
        string name;
        string ruleType;
        uint256 interestRateBps;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 minTermMonths;
        uint256 maxTermMonths;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(string => Rule) private rules;
    mapping(string => bool) private exists;

    event RuleCreated(
        string indexed ruleId,
        string name,
        string ruleType,
        uint256 interestRateBps,
        bool isActive,
        uint256 timestamp
    );

    event RuleUpdated(
        string indexed ruleId,
        uint256 interestRateBps,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 minTermMonths,
        uint256 maxTermMonths,
        bool isActive,
        uint256 timestamp
    );

    event RuleDeleted(string indexed ruleId, uint256 timestamp);

    function createRule(
        string calldata ruleId,
        string calldata name,
        string calldata ruleType,
        uint256 interestRateBps,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 minTermMonths,
        uint256 maxTermMonths,
        bool isActive
    ) external {
        require(!exists[ruleId], "Rule already exists");
        rules[ruleId] = Rule({
            ruleId: ruleId,
            name: name,
            ruleType: ruleType,
            interestRateBps: interestRateBps,
            minAmount: minAmount,
            maxAmount: maxAmount,
            minTermMonths: minTermMonths,
            maxTermMonths: maxTermMonths,
            isActive: isActive,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        exists[ruleId] = true;

        emit RuleCreated(
            ruleId,
            name,
            ruleType,
            interestRateBps,
            isActive,
            block.timestamp
        );
    }

    function updateRule(
        string calldata ruleId,
        uint256 interestRateBps,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 minTermMonths,
        uint256 maxTermMonths,
        bool isActive
    ) external {
        require(exists[ruleId], "Rule does not exist");
        Rule storage r = rules[ruleId];
        r.interestRateBps = interestRateBps;
        r.minAmount = minAmount;
        r.maxAmount = maxAmount;
        r.minTermMonths = minTermMonths;
        r.maxTermMonths = maxTermMonths;
        r.isActive = isActive;
        r.updatedAt = block.timestamp;

        emit RuleUpdated(
            ruleId,
            interestRateBps,
            minAmount,
            maxAmount,
            minTermMonths,
            maxTermMonths,
            isActive,
            block.timestamp
        );
    }

    function deleteRule(string calldata ruleId) external {
        require(exists[ruleId], "Rule does not exist");
        delete rules[ruleId];
        exists[ruleId] = false;
        emit RuleDeleted(ruleId, block.timestamp);
    }

    function getRule(string calldata ruleId) external view returns (Rule memory) {
        require(exists[ruleId], "Rule does not exist");
        return rules[ruleId];
    }
}
