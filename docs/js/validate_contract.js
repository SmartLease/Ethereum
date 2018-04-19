
$('#close-button').click(function() {
	$("#failed-contract-alert").hide();
	$("#failed-contract-alert").hide();
})

function validate() {
	
	var first_name = $("#first_name").val();
	var last_name = $("#last_name").val();
	var place_id = $("#place_id").val();
	var max_tenant = $("#max_tenant").val();
	var start_date = $("#start_date").val();
	var end_date = $("#end_date").val();
	var email = $("#email").val();
	var deposit = $("#deposit").val();
	var rent = $("#rent").val();
	var contract_box = $("#contact_dialog");

	if (last_name == "" || first_name == "" || place_id == "") {
		$("#failed-contract-alert").show();
		return;
	}

	if (userAccount && Factory)
	{
		Factory.methods.createContract(first_name, last_name)
		.send({from: userAccount})
		.on('error', function(error) {
			$("#failed-contract-alert").show();
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
