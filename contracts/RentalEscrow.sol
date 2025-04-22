// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RentalEscrow {
    address public tenant;
    address public owner;

    uint256 public rent;
    uint256 public deposit;
    uint256 public startTime;
    uint256 public monthsPaid;
    uint256 public penaltyAmount;

    bool public isActive;

    mapping(uint256 => bool) public monthPaid;

    event RentPaid(uint256 month, uint256 amount);
    event PenaltyIncurred(uint256 amount);
    event DepositRefunded(uint256 refundToTenant, uint256 toOwnerAsPenalty);
    event DamageDeducted(uint256 damagePercent, uint256 damageAmount, uint256 finalRefund);

    modifier onlyTenant() {
        require(msg.sender == tenant, "Only tenant can perform this action");
        _;
    }

    modifier onlyOwnerOrTenant() {
        require(msg.sender == tenant || msg.sender == owner, "Unauthorized");
        _;
    }

    constructor(address _tenant, address _owner, uint256 _rent, uint256 _deposit) payable {
        tenant = _tenant;
        owner = _owner;
        rent = _rent;
        deposit = _deposit;
        startTime = block.timestamp;

        require(msg.value == (rent + deposit), "Incorrect initial funds");

        isActive = true;
    }


    function payRent() external payable onlyTenant {
        require(isActive, "Contract is inactive");
        require(monthsPaid < 12, "All rent already paid");

        uint256 currentMonth = monthsPaid + 1;
        uint256 dueTime = startTime + (currentMonth - 1) * 60; // Simulate 1 month = 60s
        require(block.timestamp >= dueTime, "Too early to pay this month's rent");
        require(!monthPaid[currentMonth], "Rent already paid for this month");

        if (block.timestamp > dueTime + 60) {
            uint256 penalty = (rent * 12 * 10) / 100; // 10% of total rent
            penaltyAmount += penalty;
            emit PenaltyIncurred(penalty);
        }

        require(msg.value == rent, "Incorrect rent amount");

        payable(owner).transfer(msg.value);
        monthPaid[currentMonth] = true;
        monthsPaid++;

        emit RentPaid(currentMonth, msg.value);
    }

    function refundDepositWithDamage(uint256 damagePercent) external onlyOwnerOrTenant {
        require(isActive, "Already settled");
        require(monthsPaid == 12, "Rent not fully paid");
        require(damagePercent <= 100, "Invalid damage percent");

        uint256 damageAmount = (deposit * damagePercent) / 100;
        uint256 refundableDeposit = deposit > penaltyAmount ? deposit - penaltyAmount : 0;

        uint256 finalRefund = 0;
        if (refundableDeposit > damageAmount) {
            finalRefund = refundableDeposit - damageAmount;
            if (damageAmount > 0) {
                payable(owner).transfer(damageAmount);
            }
            if (finalRefund > 0) {
                payable(tenant).transfer(finalRefund);
            }
        } else {
            // Damage + penalties consume the entire deposit
            payable(owner).transfer(deposit);
        }

        emit DamageDeducted(damagePercent, damageAmount, finalRefund);
        emit DepositRefunded(finalRefund, deposit - finalRefund);

        isActive = false;
    }

    receive() external payable {}
}
