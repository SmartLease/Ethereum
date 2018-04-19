

function validate() {
	
	var first_name = $("#first_name").value;
	var last_name = $("#last_name").value;
	var place_id = $("#place_id").value;
	var max_tenant = $("#max_tenant").value;
	var start_date = $("#start_date").value;
	var end_date = $("#end_date").value;
	var email = $("#email").value;
	var deposit = $("#deposit").value;
	var rent = $("#rent").value;
	var contract_box = $("#contact_dialog");

	if (last_name == "" || first_name == "" || place_id == "") {
		$("#failed-contract-alert").show();
		setTimeout(function() {$("#incomplete-contract-alert").hide();}, 10000);
	}

	if (userAccount && Factory)
	{
		Factory.methods.createContract(first_name, last_name)
		.send({from: userAccount})
		.on('error', function(error) {
			$("#failed-contract-alert").show();
			setTimeout(function() {$("#failed-contract-alert").hide();}, 10000);
		})
		.on('receipt', function(receipt) {
			$('#close-button').click();
			contract_address = receipt.events.NewLease.returnValues.contract_address
			SmartLease.options.address = contract_address;
			if (place_id != "") {
				SmartLease.methods.SetPlaceId(place_id);
			}
			if (max_tenant != "") {
				SmartLease.methods.SetMaxTenants(max_tenant);
			}
			if (start_date != "") {
				SmartLease.methods.SetStartDate(start_date);
			}
			if (end_date != "") {
				SmartLease.methods.SetEndDate(end_date)
			}
			if (deposit != "") {
				SmartLease.methods.SetSecurityDeposit(deposit);
			}
			if (rent != "") {
				SmartLease.methods.SetRent(rent);
			}
			getSmartLeaseDataForLandlord(contract_address);
		});
	}

}
