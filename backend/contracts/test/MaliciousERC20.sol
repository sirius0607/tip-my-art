// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// Non-compliant ERC20 with invalid decimals
contract MaliciousERC20 {
    // Missing proper ERC20 implementation
    // No transfer function
    // Invalid decimals value
    
    function decimals() external pure returns (uint8) {
        return 19; // Invalid value (over 18)
    }
}