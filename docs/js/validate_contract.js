
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
		Factory.methods.createContract(
			first_name,
			last_name,
			place_id,
			max_tenant,
			start_date,
			end_date,
			deposit,
			rent
			)
		.send({from: userAccount})
		.on('error', function(error) {
			$("#failed-contract-alert").show();
		})
		.on('receipt', function(receipt) {
			contract_address = receipt.events.NewLease.returnValues.contract_address
			smartlease = SmartLease.clone();
			smartlease.options.address = contract_address;
			tenant_addresses = $('.tenant_address');
			for (i = 0; i < tenant_addresses.length; i++) {
				smartlease.methods.addTenant("", "", tenant_addresses[i].value)
				.send({from: userAccount})
				.on('error', function(error) {
					console.log(error);
				})
				.on('receipt', function(receipt) {
					console.log('added tenant with address ' + tenant_addresses[i].value);
				});
			};
			getSmartLeaseDataForLandlord(contract_address);
			$('not-landlord-alert').hide();
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
