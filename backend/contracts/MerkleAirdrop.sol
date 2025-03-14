// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MerkleAirdrop is Ownable {
    using SafeERC20 for IERC20;

    bytes32 public merkleRoot;
    IERC20 public immutable token;

    mapping(address => bool) public hasClaimed;

    event AirdropClaimed(address indexed claimant, uint256 amount);
    event MerkleRootUpdated(bytes32 newRoot);

    constructor(address _token, address initialOwner) Ownable(initialOwner) {
        token = IERC20(_token);
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }

    function claim(
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        require(!hasClaimed[account], "MerkleAirdrop: Already claimed");
        require(amount > 0, "MerkleAirdrop: Zero amount");

        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encode(account, amount));
        bool isValidProof = MerkleProof.verifyCalldata(
            merkleProof,
            merkleRoot,
            leaf
        );
        require(isValidProof, "MerkleAirdrop: Invalid proof");

        // Mark as claimed and transfer tokens
        hasClaimed[account] = true;
        token.safeTransfer(account, amount);

        emit AirdropClaimed(account, amount);
    }

    function withdrawTokens(address recipient) external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(recipient, balance);
    }
}