const FactoryAddress = '0x38831b0447eddbdf46040b70d7d662bf595262ee';
const FactoryURI = 'build/contracts/SmartLeaseFactory.json';
const SmartLeaseURI = 'build/contracts/SmartLease.json';

var web3js;

var userAccount;

/*

1. Check if MetaMask is installed
    -> Show error message and install information
2. Connect to factory contract
3. Get user account and set interval to check for user account changes
4. Query contracts associated with current user
5. Update table with information about contracts

*/

$(function() {
    checkForMetaMask()
    .then(loadContracts)
    .then(startUpdateLoop)
    .catch(dispError)
});


function checkForMetaMask() {
    return new Promise((resolve, reject) => {
        if (typeof web3 === 'undefined') {
            $('#create-contract').prepend(
                $(
                `<div class="alert alert-warning ml-5 mr-5" role="alert">
                <h5 class="alert-heading">MetaMask is required for this site and was not detected. To install MetaMask for your browser follow <a href="https://metamask.io/" target="_blank" class="alert-link">this link</a>.</h5>
                <hr>
                <p>If MetaMask is already installed please sign into your account.</p>
                </div>`
                )
            )
            return reject(new Error("MetaMask not detected"));
        }
        web3js = new Web3(web3.currentProvider);
        return resolve();
    });
}

function getContractABI(uri) {
    return new Promise((resolve, reject) => {
        $.getJSON(uri)
        .done(json => {return resolve(json.abi)})
        .fail((xhr, status, err) => {console.log(xhr, status, err); return reject(err)});
    });
}

function loadContracts() { // Where user is "landlord"
    let abiFactory = getContractABI(FactoryURI);
    let abiSmartLease = getContractABI(SmartLeaseURI);
    return Promise.all([abiFactory, abiSmartLease])
    .then((abis) => {
        Factory = new web3js.eth.Contract(abis[0], FactoryAddress);
        SmartLease = new web3js.eth.Contract(abis[1]); // No address yet. To be cloned and have address added later.
    });
}

function startUpdateLoop() {
    checkUser();
    setInterval(checkUser, 2000);
}

function checkUser() {
    web3js.eth.getAccounts()
    .then(accts => {
        if (userAccount !== accts[0]) {
            userAccount = accts[0];
            updateLandordTable();
            updateTenantsTable();
        }
    });
}

function updateTenantsTable() {
    $('#tenant-table tbody').empty();
    Factory.getPastEvents('NewTenant', {filter: {tenant: userAccount}, fromBlock: 0, toBlock: 'latest'})
    .then((logs) => {
        if (logs.length === 0) {
            $('#not-tenant-alert').show();
            return Promise.reject('no contracts');
        }
        $('#not-tenant-alert').hide();
        return logs.map((log) => log.returnValues.contract_address);
    })
    .then((addresses) => {
        addresses.forEach(getSmartLeaseDataForTenant);
    })
    .catch(dispError);
}

function updateLandordTable() {
    $('#landlord-table tbody').empty();
    Factory.getPastEvents('NewLease', {filter: {landlord: userAccount}, fromBlock: 0, toBlock: 'latest'})
    .then((logs) => {
        if (logs.length === 0) {
            $('#not-landlord-alert').show();
            return Promise.reject();
        }
        $('#not-landlord-alert').hide();
        return logs.map((log) => log.returnValues.contract_address);
    })
    .then((addresses) => {
        addresses.forEach(getSmartLeaseDataForLandlord);
    })
    .catch(dispError);
}   

function dispError(error) {
    console.log(error);
}

getSmartLeaseDataForLandlord = getSmartLeaseData('#landlord-table tbody');
getSmartLeaseDataForTenant = getSmartLeaseData('#tenant-table tbody');

function getSmartLeaseData(table_id_name) {
    return function(address) {
        let smartlease = SmartLease.clone();
        smartlease.options.address = address;
        methods = [
            'landlord',
            'numTenants',
            'maxTenants',
            'startDate',
            'endDate',
            'securityDeposit',
            'monthlyRent',
            'googlePlaceId',
            'isActive',
            'isSigned'
        ];
        let tr = $(document.createElement('tr'));
        Promise.all(methods.map((method) => {
            return smartlease.methods[method + '()']().call();
        }))
        .then((results) => {
            let isSigned = false;
            let isActive = false;
            tr.append($(`<td style="font-family:Monospace;">${address.toLowerCase()}</td>`));
            results.forEach((text, idx) => {
                switch (idx) {
                    case 0: // Landlord name (first, last)
                        tr.append($(`<td>${text[0]} ${text[1]}</td>`));
                        break;
                    case 3: // start date
                    case 4: // end date
                        let dateString = moment.unix(text).format("MMM Do YY");
                        tr.append($(`<td>${dateString} (GMT)</td>`));
                        break;
                    case 7: // google prop id + link
                        tr.append($(`<td><a href="#">${text}</a></td>`));
                        break;
                    case 8: // is active (past start date)
                        isActive = text;
                        if (text === false) {
                            tr.append($(`<td><span class="badge badge-warning">Not Active</span></td>`));
                        } else {
                            tr.append($(`<td><span class="badge badge-success">Active</span></td>`));
                        }
                        break;
                    case 9: // is signed (by at least one tenant)
                        isSigned = text;
                        if (text === false) {
                            tr.append($(`<td><span class="badge badge-warning">Not Signed</span></td>`));
                        } else {
                            tr.append($(`<td><span class="badge badge-info">Signed</span></td>`));
                        }
                        break;
                    default:
                        tr.append($(`<td>${text}</td>`));
                }
            });
            let editBtn = $(`<td><button class="btn btn-info" data-toggle="modal" data-target="#contact_dialog">Edit</button></td>`);
            if (isSigned || isActive) editBtn.prop("disabled", true);
            tr.prepend(editBtn);

            let deleteBtn = $(`<td><button class="btn btn-danger" data-toggle="modal" data-target="#delete-dialog">Delete</button></td>`);
            if (isActive) deleteBtn.prop("disabled", true);
            tr.prepend(deleteBtn);
        })
        .then(() => {
            tr.appendTo($(table_id_name));                
        })
        .catch(dispError);
    }
}