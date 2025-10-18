// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";

interface IDataGroup {
    function initialize(string memory _name) external;
}

contract SplitwiseGenome {
    using Clones for address;

    mapping(address => address) public secretAddress;           // e.g., iExec PD address per user
    mapping(address => address[]) public userGroups;                // user => their DataGroup clones

    address public immutable dataGroupImplementation;

    event GroupCreated(address indexed creator, address group, string name, uint256 userCount);
    event SecretAddressSet(address indexed user, address pd);

    constructor(address _dataGroupImplementation) {
        require(_dataGroupImplementation != address(0), "BAD_IMPL");
        dataGroupImplementation = _dataGroupImplementation;
    }

    function setSecretAddress(address _pdAddress) public {
        secretAddress[msg.sender] = _pdAddress;
        emit SecretAddressSet(msg.sender, _pdAddress);
    }

    /**
     * Deploys a minimal proxy (clone) of DataGroup, initializes it, and assigns it to all _users.
     * @param _users list of users to whom this group applies
     * @param _name  human-readable name stored in the clone
     * @return newSC address of the freshly deployed clone
     */
    function createGroup(
        address[] calldata _users,
        string calldata _name
    ) public returns (address newSC) {
        require(_users.length > 0, "NO_USERS");

        // 1) deploy a thin proxy (EIP-1167)
        newSC = dataGroupImplementation.clone();

        // 2) initialize the clone (owner = msg.sender)
        IDataGroup(newSC).initialize(_name);

        // 3) push this group address for every user
        for (uint256 i = 0; i < _users.length; i++) {
            groups[_users[i]].push(newSC);
        }

        emit GroupCreated(msg.sender, newSC, _name, _users.length);
    }

    function getGroups(address _user) public view returns (address[] memory) {
        return groups[_user];
    }
}