// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RentalEscrow {
    address public tenant;
    address public owner;
    uint256 public rent;
    uint256 public deposit;
    uint256 public startTime;
    uint256 public monthsPaid;

    bool public isActive;

    constructor(address _owner, uint256 _rent, uint256 _deposit) payable {
        tenant = msg.sender;
        owner = _owner;
        rent = _rent;
        deposit = _deposit;
        startTime = block.timestamp;

        require(msg.value == (rent * 12 + deposit), "Incorrect initial funds");

        isActive = true;
    }

    function releaseRent() public {
        require(isActive, "Contract inactive");
        require(monthsPaid < 12, "All rent paid");
        require(block.timestamp >= startTime + monthsPaid * 60, "Too early");

        monthsPaid++;
        payable(owner).transfer(rent);
    }

    function refundDepositWithDamage(uint256 damagePercent) public {
        require(isActive, "Contract already closed");
        require(monthsPaid == 12, "Rent not fully paid");
        require(msg.sender == tenant || msg.sender == owner, "Unauthorized");

        require(damagePercent <= 100, "Invalid damage percentage");

        uint256 damageAmount = (deposit * damagePercent) / 100;
        uint256 refundAmount = deposit - damageAmount;

        if (damageAmount > 0) {
            payable(owner).transfer(damageAmount);
        }
        if (refundAmount > 0) {
            payable(tenant).transfer(refundAmount);
        }

        isActive = false;
    }
}
