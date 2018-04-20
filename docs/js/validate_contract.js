
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

	if (userAccount && Factory) {
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
			console.log(error);
			$("#failed-contract-alert").show();
		})
		.then( function(receipt) {
			// console.log('the receipt', receipt);
			contract_address = receipt.events.NewLease.returnValues.contract_address;
			let smartlease = SmartLease.clone();
			smartlease.options.address = contract_address;
			let tenant_addresses = [];
			let ta_obj = $('.tenant_address');
			for (let i = 0; i < ta_obj.length; i++) {
				tenant_addresses.push(ta_obj[i].value);
			}
			console.log(tenant_addresses);
			// if (tenant_addresses.length === 0) return Promise.resolve([]);
			Promise.all(tenant_addresses.map(addr => {
				return smartlease.methods.addTenant('', '', addr).send({from: userAccount})
			}))
			.then(receipts => {
				$("#contact_dialog").modal('hide');
				getSmartLeaseDataForLandlord(contract_address);
			})
			.catch(error => {
				console.log(error);
			});
		})
		.catch(error => {
			console.log(error);
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
