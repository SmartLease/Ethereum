pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./smartlease.sol";

contract SmartLeaseFactory is Ownable {

    event NewLease(address contract_address, address indexed landlord);
    event NewTenant(address contract_address, address indexed tenant);

    string public test = "Connected";

    // function createContract(string _first, string _last) external returns (SmartLease leaseAddress) {
    //     SmartLease newContract = new SmartLease(_first, _last);
    //     newContract.transferOwnership(tx.origin);
    //     emit NewLease(newContract, tx.origin);
    //     return newContract;
    // }

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

	function emitNewTenant(address _contract_address, address _tenant) public {
		emit NewTenant(_contract_address, _tenant);
	}
}