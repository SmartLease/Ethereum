
function validate() {
	
	var first_name = $("#first_name").val();
	var last_name = $("#last_name").val();
	var place_id = $("#place_id").val();
	var max_tenant = $("#max_tenant").val();
	var start_date = moment($("#start_date").val(), "YYYY-MM-DD").unix();
	var end_date = moment($("#end_date").val(), "YYYY-MM-DD").unix();
	var email = $("#email").val();
	var deposit = $("#deposit").val();
	var rent = $("#rent").val();
	var contract_box = $("#contact_dialog");

	if (!last_name || !first_name || !place_id) {
		$("#incomplete-contract-alert").show();
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
			contract_address = receipt.events.NewLease.returnValues.contract_address
			let smartlease = SmartLease.clone();
			smartlease.options.address = contract_address;
			console.log(receipt)
			debugger
			if (place_id) {
				smartlease.methods.setGooglePlaceId(place_id)
				.send({from: userAccount})
				.on('error', function(error) {
					console.log(error);
				})
				.on('receipt', function(receipt) {
					console.log(receipt);
				});
			}
			if (max_tenant) {
				smartlease.methods.setMaxTenants(max_tenant)
				.send({from: userAccount})
				.then(() => {
					console.log("max_tenant set to " + max_tenant);
				});
			}
			if (start_date) {
				smartlease.methods.setStartDate(start_date)
				.send({from: userAccount})
				.on('error', function(error) {
					console.log(error);
				})
				.on('receipt', function(receipt) {
					console.log(receipt);
				});
			}
			if (end_date) {
				smartlease.methods.setEndDate(end_date)
				.send({from:userAccount})
			}
			if (deposit) {
				smartlease.methods.setSecurityDeposit(deposit);
			}
			if (rent) {
				smartlease.methods.setRent(rent);
			}
			getSmartLeaseDataForLandlord(contract_address);
			$('#close-button').click();
		});
	}

}

function add_tenant_input() {

	if ($('div .for_tenant_address').length < $("#max_tenant").val()) {
		$("#contact_form").append(`<div class="modal-body for_tenant_address"> \
		<label for="tenant_address">Tenant Ethereum Address:</label><input \
		type="text" class="form-control tenant_address" id="tenant_address" \
		placeholder="Enter Tenant's Ethereum Address" name="tenant_address"></div>`);
	}
	
}
