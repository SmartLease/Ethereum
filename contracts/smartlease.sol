pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/ECRecovery.sol";


contract FactoryAPI {
    /*
     *   Abstract contract to allow SmartLease to emit a NewTenant event in the factory.
     */
    function emitNewTenant(address _contract_address, address _tenant) public;
    function emitDestroyLease(address _lease_address, address _recipient) public;
}

contract SmartLease is Ownable {

    event ApprovedSmartLease(address indexed tenant);

    string public test = "Connected";

    struct Person {
        string firstName;
        string lastName;
    }

    address public factoryAddr;

    Person public landlord;
    Person[] public tenants;
    mapping (address => uint) public tenantAddressToId;
    mapping (address => bool) public tenantToSigned;
    uint public maxTenants = 1;
    uint public numTenants = 0;
    uint public startDate = 0;
    uint public endDate = 0;
    uint public securityDeposit = 0;
    uint public monthlyRent = 0;
    string public googlePlaceId = "";
    bool public isActive;
    bool public isSigned;

    modifier beforeSigning() {
        require(isSigned == false);
        _;
    }

    function signLease(bytes32 _hash, bytes _sig) public {
        require(msg.sender == ECRecovery.recover(_hash, _sig) && _hash == keccak256("\x19Ethereum Signed Message:\n7I AGREE"));
        tenantToSigned[msg.sender] = true;
        isSigned = true;
        emit ApprovedSmartLease(msg.sender);
    }

    function SmartLease(
        string _landlordFirst,
        string _landlordLast,
        string _googlePlaceId,
        uint _maxTenants,
        uint _startDate,
        uint _endDate,
        uint _securityDeposit,
        uint _rent
        ) public
    {
        require(_maxTenants > 0);
        require(_endDate > _startDate);

        landlord.firstName = _landlordFirst;
        landlord.lastName = _landlordLast;
        googlePlaceId = _googlePlaceId;
        maxTenants = _maxTenants;
        startDate = _startDate;
        endDate = _endDate;
        securityDeposit = _securityDeposit;
        monthlyRent = _rent;

        factoryAddr = msg.sender;
    }

    function setMaxTenants(uint _maxTenants) public onlyOwner beforeSigning {
        require(_maxTenants > 0);
        maxTenants = _maxTenants;
    }

    function addTenant(string _firstName, string _lastName, address _tenantAddr) public onlyOwner beforeSigning {
        require(numTenants < maxTenants);
        tenants.push(Person(_firstName, _lastName));
        tenantAddressToId[_tenantAddr] = numTenants++;
        FactoryAPI factory = FactoryAPI(factoryAddr);
        factory.emitNewTenant(this, _tenantAddr);
    }

    function setStartDate(uint _seconds) public onlyOwner beforeSigning {
        startDate = _seconds;
    }

    function setEndDate(uint _seconds) public onlyOwner beforeSigning {
        endDate = _seconds;
    }

    function setSecurityDeposit(uint _securityDepositAmount) public onlyOwner beforeSigning {
        securityDeposit = _securityDepositAmount;
    }
    
    function setRent(uint _rentAmount) public onlyOwner beforeSigning {
        monthlyRent = _rentAmount;
    }

    function setGooglePlaceId(string _googlePlaceId) public onlyOwner beforeSigning {
        googlePlaceId = _googlePlaceId;
    }

    function paySecurityDeposit() public payable { }

    function destroy() onlyOwner public {
        FactoryAPI factory = FactoryAPI(factoryAddr);
        factory.emitDestroyLease(this, owner);
        selfdestruct(owner);
    }

    function destroyAndSend(address _recipient) onlyOwner public {
        FactoryAPI factory = FactoryAPI(factoryAddr);
        factory.emitDestroyLease(this, _recipient);
        selfdestruct(_recipient);
    }
}