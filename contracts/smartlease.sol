pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/ECRecovery.sol";

contract DateTimeAPI {
    /*
     *  Abstract contract for interfacing with the DateTime contract.
     *  See: https://github.com/pipermerriam/ethereum-datetime/blob/master/contracts/DateTime.sol
     */
    function isLeapYear(uint16 year) public pure returns (bool);
    function getYear(uint timestamp) public pure returns (uint16);
    function getMonth(uint timestamp) public pure returns (uint8);
    function getDay(uint timestamp) public pure returns (uint8);
    function getHour(uint timestamp) public pure returns (uint8);
    function getMinute(uint timestamp) public pure returns (uint8);
    function getSecond(uint timestamp) public pure returns (uint8);
    function getWeekday(uint timestamp) public pure returns (uint8);
    function toTimestamp(uint16 year, uint8 month, uint8 day) public pure returns (uint timestamp);
    function toTimestamp(uint16 year, uint8 month, uint8 day, uint8 hour) public pure returns (uint timestamp);
    function toTimestamp(uint16 year, uint8 month, uint8 day, uint8 hour, uint8 minute) public pure returns (uint timestamp);
    function toTimestamp(uint16 year, uint8 month, uint8 day, uint8 hour, uint8 minute, uint8 second) public pure returns (uint timestamp);
}

contract FactoryAPI {
    /*
     *   Abstract contract to allow SmartLease to emit a NewTenant event in the factory.
     */
    function emitNewTenant(address _contract_address, address _tenant) public;
}

contract SmartLease is Ownable {

    event NewSmartLease(address indexed landlord);
    event ApproveSmartLease(address indexed tenant);

    struct Person {
        string firstName;
        string lastName;
    }

    address dateTimeAddr = 0; // main chain address: 0x1a6184CD4C5Bea62B0116de7962EE7315B7bcBce;
    DateTimeAPI DateTime = DateTimeAPI(dateTimeAddr);

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
    string public googlePropertyId = "";
    bool public isValid;
    bool public isSigned;

    modifier beforeSigning() {
        require(isSigned == false);
        _;
    }

    modifier dateTimeAddressValid(address _dtAddress) {
        require(_dtAddress != 0);
        _;
    }

    function signLease(bytes32 _hash, bytes _sig) public {
        require(msg.sender == ECRecovery.recover(_hash, _sig) && _hash == keccak256("\x19Ethereum Signed Message:\n7I AGREE"));
        tenantToSigned[msg.sender] = true;
        isSigned = true;
    }

    function SmartLease(string _firstName, string _lastName) public {
        landlord.firstName = _firstName;
        landlord.lastName = _lastName;
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

    function setStartDate(uint16 _year, uint8 _month, uint8 _day) public onlyOwner beforeSigning dateTimeAddressValid(dateTimeAddr) {
        startDate = DateTime.toTimestamp(_year, _month, _day);
    }

    function setEndDate(uint16 _year, uint8 _month, uint8 _day) public onlyOwner beforeSigning dateTimeAddressValid(dateTimeAddr) {
        endDate = DateTime.toTimestamp(_year, _month, _day);
    }

    function setSecurityDeposit(uint _securityDepositAmount) public onlyOwner beforeSigning {
        securityDeposit = _securityDepositAmount;
    }

    function setGooglePropertyId(string _googlePropertyId) public onlyOwner beforeSigning {
        googlePropertyId = _googlePropertyId;
    }
}