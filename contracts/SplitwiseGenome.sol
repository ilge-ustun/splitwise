// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";

interface IGroupData {
    function initialize(string memory _name) external;
}

contract SplitwiseGenome {
    using Clones for address;

   mapping(address => address[]) public userGroups;                // user => their DataGroup clones

    address public immutable groupDataImplementation;

    event GroupCreated(address indexed creator, address groupData, string name, uint256 userCount);
    
    constructor(address _groupDataImplementation) {
        require(_groupDataImplementation != address(0), "BAD_IMPL");
        groupDataImplementation = _groupDataImplementation;
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
        newSC = groupDataImplementation.clone();

        // 2) initialize the clone (owner = msg.sender)
        IGroupData(newSC).initialize(_name);

        // 3) push this group address for every user
        for (uint256 i = 0; i < _users.length; i++) {
            userGroups[_users[i]].push(newSC);
        }

        emit GroupCreated(msg.sender, newSC, _name, _users.length);
    }

    function getGroups(address _user) public view returns (address[] memory) {
        return userGroups[_user];
    }
}