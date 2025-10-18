// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Group {
    string public name;
    address public pd_members;
    address[] public expenses;
    address public debts;
    bool public initialized;

    event NameUpdated(string name);
    event ExpenseAdded(address value);
    event DebtsSet(address value);

    modifier onlyOnce() {
        require(!initialized, "ALREADY_INIT");
        initialized = true;
        _;
    }

    function initialize(string memory _name, address _pd_members)
        external
        onlyOnce
    {
        pd_members = _pd_members;
        name = _name;
        emit NameUpdated(_name);
    }

    function addExpense(address value) external {
        expenses.push(value);
        emit ExpenseAdded(value);
    }

    function setDebts(address _pd_debts) external {
        debts = _pd_debts;
        emit DebtsSet(_pd_debts);
    }

    function getExpenses() external view returns (address[] memory) {
        return expenses;
    }

    function getDebts() external view returns (address) {
        return debts;
    }

    function getPdMembers() external view returns (address) {
        return pd_members;
    }
}