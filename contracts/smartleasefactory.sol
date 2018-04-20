pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./smartlease.sol";

contract SmartLeaseFactory is Ownable {

    event NewLease(address contract_address, address indexed landlord);
    event NewTenant(address contract_address, address indexed tenant);
	event DestroyLease(address indexed contract_address, address _recipient);

    string public test = "Connected";

	modifier landlordOnly() {
		SmartLease existingLease = SmartLease(msg.sender);
		require(tx.origin == existingLease.owner());
		_;
	}

	modifier smartleaseOnly(address _lease_address) {
		require(msg.sender == _lease_address);
		_;
	}

	function createContract(
		string _landlordFirst, 
		string _landlordLast,
		string _googlePlaceId,
		uint _maxTenants,
		uint _startDate, 
		uint _endDate,
		uint _securityDeposit, 
		uint _rent
		) external returns (SmartLease leaseAddress)
	{
		SmartLease newContract = new SmartLease(_landlordFirst, _landlordLast,
												_googlePlaceId,
												_maxTenants,
												_startDate, _endDate,
												_securityDeposit, _rent);
		newContract.transferOwnership(tx.origin);
        emit NewLease(newContract, tx.origin);
        return newContract;
    }

	function emitNewTenant(address _lease_address, address _tenant_address) public smartleaseOnly(_lease_address) landlordOnly {
		emit NewTenant(_lease_address, _tenant_address);
	}

	function emitDestroyLease(address _lease_address, address _recipient) public smartleaseOnly(_lease_address) landlordOnly {
		emit DestroyLease(_lease_address, _recipient);
	}
}