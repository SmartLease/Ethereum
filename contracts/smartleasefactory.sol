pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./smartlease.sol";

contract SmartLeaseFactory is Ownable {

	event NewLease(address contract_address, address indexed landlord);

	string public test = "Weird";

	function createContract(string _first, string _last) external {
		SmartLease newContract = new SmartLease(_first, _last);
		newContract.transferOwnership(tx.origin);
		emit NewLease(newContract, tx.origin);
	}
}