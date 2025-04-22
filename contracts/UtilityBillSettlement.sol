// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UtilityBillSettlement {
    address public tenant;
    address public owner;
    address public electricityProvider;
    address public waterProvider;
    address public internetProvider;

    uint public monthlyDeposit;
    uint public depositDeadline;
    uint public gracePeriod = 7 days;
    uint public penaltyRate = 10;

    mapping(string => uint) public billAmounts;
    mapping(string => bool) public serviceActive;

    bool public depositMade = false;
    uint public totalBill;
    uint public pendingExcess;

    event FundsDeposited(uint amount);
    event BillPaid(string service, uint amount);
    event ReceiptSent(string service, uint amount);
    event ServicePaused(string service);
    event ServiceResumed(string service);
    event ExcessCalculated(uint amount);

    modifier onlyTenant() {
        require(msg.sender == tenant, "Only tenant can call this");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(
        address _tenant,
        address _owner,
        address _electricityProvider,
        address _waterProvider,
        address _internetProvider,
        uint _monthlyDeposit
    ) {
        tenant = _tenant;
        owner = _owner;
        electricityProvider = _electricityProvider;
        waterProvider = _waterProvider;
        internetProvider = _internetProvider;
        monthlyDeposit = _monthlyDeposit;

        serviceActive["electricity"] = true;
        serviceActive["water"] = true;
        serviceActive["internet"] = true;
    }

    function depositFunds() external payable onlyTenant {
        require(msg.value >= monthlyDeposit, "Insufficient deposit amount");
        depositMade = true;
        depositDeadline = block.timestamp;
        emit FundsDeposited(msg.value);
    }

    function inputBills(uint electricity, uint water, uint internet) external onlyOwner {
        require(depositMade, "Deposit not made");

        billAmounts["electricity"] = electricity;
        billAmounts["water"] = water;
        billAmounts["internet"] = internet;

        totalBill = electricity + water + internet;

        uint balanceNow = address(this).balance;

        if (totalBill <= balanceNow) {
            _payUtility("electricity", electricity, electricityProvider);
            _payUtility("water", water, waterProvider);
            _payUtility("internet", internet, internetProvider);
            depositMade = false;
            pendingExcess = 0;
        } else {
            // Calculate and store excess amount needed
            pendingExcess = totalBill - balanceNow;

            serviceActive["electricity"] = false;
            serviceActive["water"] = false;
            serviceActive["internet"] = false;

            emit ExcessCalculated(pendingExcess);
            emit ServicePaused("electricity");
            emit ServicePaused("water");
            emit ServicePaused("internet");
        }
    }

    function _payUtility(string memory service, uint amount, address provider) internal {
        payable(provider).transfer(amount);
        emit BillPaid(service, amount);
        emit ReceiptSent(service, amount);
    }

    function getExcessAmount() public view returns (uint) {
        return pendingExcess;
    }

    function getPenaltyAmount() public view returns (uint) {
        return (totalBill * penaltyRate) / 100;
    }

    function balanceBill() external payable onlyTenant {
        require(msg.value == pendingExcess, "Incorrect excess amount");

        _payUtility("electricity", billAmounts["electricity"], electricityProvider);
        _payUtility("water", billAmounts["water"], waterProvider);
        _payUtility("internet", billAmounts["internet"], internetProvider);

        serviceActive["electricity"] = true;
        serviceActive["water"] = true;
        serviceActive["internet"] = true;

        depositMade = false;
        pendingExcess = 0;

        emit ServiceResumed("electricity");
        emit ServiceResumed("water");
        emit ServiceResumed("internet");
    }

    function payPenaltyAndResume() external payable onlyTenant {
        uint penalty = getPenaltyAmount();
        require(msg.value == penalty, "Incorrect penalty amount");

        payable(owner).transfer(penalty);

        serviceActive["electricity"] = true;
        serviceActive["water"] = true;
        serviceActive["internet"] = true;

        emit ServiceResumed("electricity");
        emit ServiceResumed("water");
        emit ServiceResumed("internet");
    }

    receive() external payable {}
}
