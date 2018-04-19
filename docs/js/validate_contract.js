

function validate() {
	
	var first_name = document.getElementById("first_name").value;
	var last_name = document.getElementById("last_name").value;
	var place_id = document.getElementById("place_id").value;
	var max_tenant = document.getElementById("max_tenant").value;
	var start_date = document.getElementById("start_date").value;
	var end_date = document.getElementById("end_date").value;
	var email = document.getElementById("email").value;
	var contract_box = $("#contact_dialog");

	if (userAccount && Factory)
	{
		Factory.methods.createContract(first_name, last_name)
		.send({from: userAccount})
		.on('error', function(error) {
			$("#failed-contract-alert").show();
			setTimeout(function() {$("#failed-contract-alert").hide();}, 5000);
		})
		.on('receipt', function(receipt) {
			$('#close-button').click();
			console.log(receipt.events.NewLease.returnValues.contract_address);
			getSmartLeaseDataForLandlord(receipt.events.NewLease.returnValues.contract_address);
		});
	}

}
