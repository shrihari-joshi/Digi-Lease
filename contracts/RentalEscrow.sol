// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RentalEscrow {
    address public tenant;
    address public owner;
    uint256 public rentAmount;
    uint256 public depositAmount;
    uint256 public startTime;
    uint256 public monthsPaid;

    constructor(address _owner, uint256 _rentAmount, uint256 _depositAmount) payable {
        tenant = msg.sender;
        owner = _owner;
        rentAmount = _rentAmount;
        depositAmount = _depositAmount;
        require(msg.value == (_depositAmount + (_rentAmount * 12)), "Insufficient upfront payment");
        startTime = block.timestamp;
    }

    function releaseRent() public {
        require(monthsPaid < 12, "All rents already paid");

        uint256 timeElapsed = block.timestamp - startTime;
        uint256 monthsElapsed = timeElapsed / 60; // 1 month = 60 seconds for simulation

        require(monthsElapsed > monthsPaid, "No rent due yet");

        monthsPaid++;
        payable(owner).transfer(rentAmount);
    }

    function refundDeposit() public {
        require(monthsPaid == 12, "Rental period not completed");
        payable(tenant).transfer(depositAmount);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
