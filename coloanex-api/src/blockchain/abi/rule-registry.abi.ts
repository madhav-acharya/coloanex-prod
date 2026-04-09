export const RULE_REGISTRY_ABI = [
  'function createRule(string ruleId, string name, string ruleType, uint256 interestRateBps, uint256 minAmount, uint256 maxAmount, uint256 minTermMonths, uint256 maxTermMonths, bool isActive) external',
  'function updateRule(string ruleId, uint256 interestRateBps, uint256 minAmount, uint256 maxAmount, uint256 minTermMonths, uint256 maxTermMonths, bool isActive) external',
  'function deleteRule(string ruleId) external',
  'function getRule(string ruleId) external view returns (tuple(string ruleId, string name, string ruleType, uint256 interestRateBps, uint256 minAmount, uint256 maxAmount, uint256 minTermMonths, uint256 maxTermMonths, bool isActive, uint256 createdAt, uint256 updatedAt))',
];
