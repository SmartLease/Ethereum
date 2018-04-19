
function validate() {
	
	var first_name = $("#first_name").val();
	var last_name = $("#last_name").val();
	var place_id = $("#place_id").val();
	var max_tenant = moment($("#max_tenant").val(), "YYYY-MM-DD").unix();
	var start_date = moment($("#start_date").val(), "YYYY-MM-DD").unix();
	var end_date = $("#end_date").val();
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
			$('#close-button').click();
			contract_address = receipt.events.NewLease.returnValues.contract_address
			SmartLease.options.address = contract_address;
			if (place_id) {
				SmartLease.methods.SetPlaceId(place_id);
			}
			if (max_tenant) {
				SmartLease.methods.SetMaxTenants(max_tenant);
			}
			if (start_date) {
				SmartLease.methods.SetStartDate(start_date);
			}
			if (end_date) {
				SmartLease.methods.SetEndDate(end_date)
			}
			if (deposit) {
				SmartLease.methods.SetSecurityDeposit(deposit);
			}
			if (rent) {
				SmartLease.methods.SetRent(rent);
			}
			getSmartLeaseDataForLandlord(contract_address);
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
