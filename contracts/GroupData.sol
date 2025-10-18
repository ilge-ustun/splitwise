// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Minimal per-group container:
 * - string name
 * - address[] data
 */
contract GroupData {
    string public name;
    address[] private _expenses;
    bool private _initialized;

    event NameUpdated(string name);
    event ExpenseAdded(address value);

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

    function getExpenses() external view returns (address[] memory) {
        return _expenses;
    }
}