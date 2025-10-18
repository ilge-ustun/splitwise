// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";

interface IGroup {
    function initialize(string memory _name) external;
}

contract SplitwiseGenome {
    using Clones for address;

    mapping(address => address[]) public userGroups;                // user => their DataGroup clones
    // mapping(address => address) public pd_secretAddress;            // user => their secret address on iExec DataProtector
    address public immutable groupImplementation;

    event GroupCreated(address indexed creator, address group, string name);
    // event SecretAddressSet(address indexed user, address pd_secretAddress);

    constructor(address _groupImplementation) {
        require(_groupImplementation != address(0), "BAD_IMPL");
        groupImplementation = _groupImplementation;
    }

    /**
     * Deploys a minimal proxy (clone) of Group, initializes it, and assigns it to all _users.
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
        newSC = groupImplementation.clone();

        // 2) initialize the clone (owner = msg.sender)
        IGroup(newSC).initialize(_name);

        // 3) push this group address for every user
        for (uint256 i = 0; i < _users.length; i++) {
            userGroups[_users[i]].push(newSC);
        }

        emit GroupCreated(msg.sender, newSC, _name);
    }

    function getGroups(address _user) public view returns (address[] memory) {
        return userGroups[_user];
    }

    // function setSecretAddress(address _pd_secretAddress) public {
    //     pd_secretAddress[msg.sender] = _pd_secretAddress;
    //     emit SecretAddressSet(msg.sender, _pd_secretAddress);
    // }
}