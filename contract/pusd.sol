// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
 

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PYUSDReceiver is Ownable {
    // The PYUSD token contract
    IERC20 public pyusd;
    

    // Events
    event Received(address indexed sender, uint256 amount);
    event Withdrawn(address indexed recipient, uint256 amount);
    

    // Constructor that connects to the PYUSD contract
    constructor(address _pyusdAddress) Ownable(msg.sender) {
        require(_pyusdAddress != address(0), "Invalid PYUSD address");
        pyusd = IERC20(_pyusdAddress);
    }
    

    // Function that allows anyone to donate PYUSD
    function donate(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
       

        // Transfer tokens from sender to this contract
        pyusd.transferFrom(msg.sender, address(this), _amount);
       

        emit Received(msg.sender, _amount);
    }
    

    // Function that allows owner to withdraw balance
    function withdrawAll() external onlyOwner {
        uint256 balance = pyusd.balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
       

        // Transfer all tokens from this contract to the owner
        pyusd.transfer(msg.sender, balance);
       

        emit Withdrawn(msg.sender, balance);
    }
}