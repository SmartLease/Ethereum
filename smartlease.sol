pragma solidity ^0.4.21;

import "./node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./node_modules/zeppelin-solidity/contracts/ECRecovery.sol";

contract DateTimeAPI {
    /*
    *  Abstract contract for interfacing with the DateTime contract.
    *
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

contract SmartLease is Ownable {

    event NewSmartLease(address indexed landlord);
    event NewTenant(string firstName, string lastName);
    event ApproveSmartLease(address indexed tenant);

    struct Person {
        string firstName;
        string lastName;
    }

    address dtContract = 0x1a6184CD4C5Bea62B0116de7962EE7315B7bcBce;
    DateTimeAPI DateTime = DateTimeAPI(dtContract);

    Person public landlord;
    Person[] public tenants;
    mapping (address => uint) public tenantAddressToId;
    mapping (address => bool) public tenantToSigned;
    uint public maxTenants;
    uint public numTenants;
    uint public startDate;
    uint public endDate;
    uint public securityDeposit;
    bytes32 public googlePropertyId;
    bool isValid;
    bool isSigned;

    modifier beforeSigning() {
        require(isSigned == false);
        _;
    }

    function signLease(bytes32 hash, bytes sig) public {
        require(msg.sender == ECRecovery.recover(hash, sig) && hash == keccak256("I agree"));
        tenantToSigned[msg.sender] = true;
    }

    function SmartLease(string _firstName, string _lastName) public {
        landlord.firstName = _firstName;
        landlord.lastName = _lastName;
        emit NewSmartLease(owner);
    }

    function addTenant(string _firstName, string _lastName) public onlyOwner beforeSigning {
        require(numTenants < maxTenants);
        tenants.push(Person(_firstName, _lastName));
        numTenants++;
        emit NewTenant(_firstName, _lastName);
    }

    function setStartDate(uint16 _year, uint8 _month, uint8 _day) public onlyOwner beforeSigning {
        startDate = DateTime.toTimestamp(_year, _month, _day);
    }

    function setEndDate(uint16 _year, uint8 _month, uint8 _day) public onlyOwner beforeSigning {
        endDate = DateTime.toTimestamp(_year, _month, _day);
    }

    function setSecurityDeposit(uint _securityDepositAmount) public onlyOwner beforeSigning {
        securityDeposit = _securityDepositAmount;
    }

    function setGooglePropertyId(bytes32 _googlePropertyId) public onlyOwner beforeSigning {
        googlePropertyId = _googlePropertyId;
    }
}