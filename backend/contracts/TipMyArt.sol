// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract TipMyArt is ERC20, ERC20Burnable, Ownable, ERC20Permit {

    constructor()
        ERC20("TipMyArt", "TMA")
        Ownable(msg.sender)
        ERC20Permit("TipMyArt")
    {
         // decimals() = 10 ** 18
          uint _initial_supply = 1000000 * 10 ** decimals();
         _mint(msg.sender, _initial_supply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}