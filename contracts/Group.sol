// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Group {
    string public name;
    address[] private _expenses;
    address private _debts;
    bool private _initialized;

    event NameUpdated(string name);
    event ExpenseAdded(address value);
    event DebtsSet(address value);

    modifier onlyOnce() {
        require(!_initialized, "ALREADY_INIT");
        _initialized = true;
        _;
    }

    function initialize(string memory _name)
        external
        onlyOnce
    {
        name = _name;
        emit NameUpdated(_name);
    }

    function addExpense(address value) external {
        _expenses.push(value);
        emit ExpenseAdded(value);
    }

    function setDebts(address _pd_address) external {
        _debts = _pd_address;
        emit DebtsSet(_pd_address);
    }

    function getExpenses() external view returns (address[] memory) {
        return _expenses;
    }

    function getDebts() external view returns (address) {
        return _debts;
    }
}