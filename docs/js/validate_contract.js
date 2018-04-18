

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
		.then(function(receipt) {
			getSmartLeaseDataForLandlord();
			contract_box.css('display', 'none');
			contract_box.prop('aria-hidden', 'true');
			$('.modal-backdrop').remove();
			$('body').removeClass('modal-open');
			console.log(receipt);
		});
	}

}
