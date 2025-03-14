// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
}

contract ERC20Airdrop is Ownable {
    IERC20 public immutable token;
    uint256 public immutable airdropAmount;
    uint256 public immutable whitelistAmount;
    bytes32 public merkleRoot;
    
    mapping(address => bool) public hasClaimed;

    event AirdropClaimed(address indexed claimant, uint256 amount);
    event MerkleRootUpdated(bytes32 newRoot);

    constructor(IERC20 _token) Ownable(msg.sender) {
        require(_token.decimals() <= 18, "Invalid decimals");
        token = _token;
        uint8 decimals = _token.decimals();
        airdropAmount = 1000 * (10 ** decimals);
        whitelistAmount = 2000 * (10 ** decimals);
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
         emit MerkleRootUpdated(_merkleRoot);
    }

    function claim() external {
        require(!hasClaimed[msg.sender], "Already claimed");
        hasClaimed[msg.sender] = true;
        require(token.transfer(msg.sender, airdropAmount), "Transfer failed");
        emit AirdropClaimed(msg.sender, airdropAmount);
    }

    function claimWhitelist(bytes32[] calldata proof) external {
        require(merkleRoot != bytes32(0), "Merkle root not set");
        require(!hasClaimed[msg.sender], "Already claimed");
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");
        
        hasClaimed[msg.sender] = true;
        require(token.transfer(msg.sender, whitelistAmount), "Transfer failed");
         emit AirdropClaimed(msg.sender, whitelistAmount);
    }

    function withdrawTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner(), balance), "Transfer failed");
    }
}