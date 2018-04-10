pragma ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./smartlease.sol";

contract SmartLeaseFactory is Ownable {

	event newLease(address contract_address, address indexed landlord);

	function createContract(string _first, string _last) external {
		address newContract = new SmartLease(_first, _last);
		emit newLease(newContract, msg.sender);
	}

}
