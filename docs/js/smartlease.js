const FactoryAddress = "0x990073D2a5f22dad55C90e6C850440d9d20600dc"; // ropsten address
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
    setUpHandlers();

    checkForMetaMask()
    .then(loadContracts)
    .then(startUpdateLoop)
    .catch(dispError);
});


function setDeleteHandler() {
    $('#delete-dialog').on('show.bs.modal', function(modal_event) {
        let btn = $(modal_event.relatedTarget);
        let contract_address = btn.data('contract');

        let dialog = $(this);
        dialog.find("button:contains('Delete')").on('click', function(delete_event) {
            delete_event.preventDefault();
            let smartlease = SmartLease.clone();
            smartlease.options.address = contract_address;
            console.log(smartlease.options.address);
            smartlease.methods.destroy().send({from: userAccount})
            // .on('error', dispError)
            // .on('receipt', function(receipt) {
            //     console.log(receipt);
            //     dialog.modal('hide');
            // })
            .then(console.log)
            .catch(dispError)
            .finally(() => dialog.modal('hide'));
        });
    });
}

function setSignatureHandler() {
    $('#signature-dialog').on('show.bs.modal', function(modal_event) {
        let btn = $(modal_event.relatedTarget);
        let contract_address = btn.data('contract');
        let dialog = $(this);
        dialog.find("button:contains('Sign')").on('click', function(sign_event) {
            sign_event.preventDefault();
            let msg = dialog.find("#msg").val();
            console.log(msg);
            let smartlease = SmartLease.clone();
            smartlease.options.address = contract_address;
            let msg_hash = web3js.utils.keccak256("\x19Ethereum Signed Message:\n" + msg.length + msg);
            web3.eth.sign(userAccount, msg_hash, (error, signature) => { // only web3 working for signing??
                smartlease.methods.signLease(msg_hash, signature).send({from: userAccount})
                .on('error', console.log)
                .then(receipt => {
                    // console.log(receipt);
                    getSmartLeaseDataForTenant(contract_address);
                })
                .finally(() => dialog.modal('hide'));
            });
        });
    });
}

function setUpHandlers() {
    setDeleteHandler();
    setSignatureHandler();
}

function checkForMetaMask() {
    return new Promise((resolve, reject) => {
        if (typeof web3 === 'undefined') {
            $('#metamask-alert').prepend(
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
    setInterval(checkUser, 1000);
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
            return Promise.reject("no contracts");
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
        let tr = $(document.createElement('tr'));
        let isSigned = false;
        let isActive = false;
        Factory.getPastEvents('DestroyLease',{filter: {contract_address: address}, fromBlock: 0, toBlock: 'latest'})
        .then((logs) => {
            console.log(logs);
            if (logs.length !== 0) {
                console.log('destroy:', logs);
                return Promise.reject();
            }
            return Promise.resolve();
        })
        .then(() => {
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
            return Promise.all(methods.map((method) => {
                return smartlease.methods[method + '()']().call()
            }))
            .then((results) => {
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
                            tr.append($(`<td><a href="https://www.google.com/maps/place/?q=place_id:${text}" target=_blank>${text}</a></td>`));
                            break;
                        case 8: // is active (past start date)
                            isActive = text;
                            if (isActive === false) {
                                tr.append($(`<td><span class="badge badge-warning">Not Active</span></td>`));
                            } else {
                                tr.append($(`<td><span class="badge badge-success">Active</span></td>`));
                            }
                            break;
                        case 9: // is signed (by at least one tenant)
                            isSigned = text;
                            if (isSigned === false) {
                                tr.append($(`<td><span class="badge badge-warning">Not Signed</span></td>`));
                            } else {
                                tr.append($(`<td><span class="badge badge-info">Signed</span></td>`));
                            }
                            break;
                        default:
                            tr.append($(`<td>${text}</td>`));
                    }
                });
            })
            .then(() => {
                if (table_id_name.includes('tenant')) {
                    let signBtn = $(`<td><button class="btn btn-success" data-toggle="modal" data-target="#signature-dialog" data-contract="${address.toLowerCase()}">Sign</button></td>`);
                    smartlease.methods.tenantToSigned(userAccount).call()
                    .then(signStatus => {
                        signBtn.find('button').prop("disabled", signStatus);
                        tr.prepend(signBtn);
                        tr.prepend($('<td></td>'));
                    })
                    .catch(dispError);
                } else {
                    let editBtn = $(`<td><button class="btn btn-info" data-toggle="modal" data-target="#contact_dialog" data-contract="${address.toLowerCase()}">Edit</button></td>`);
                    editBtn.find('button').prop("disabled", isSigned || isActive);
                    tr.prepend(editBtn);
    
                    let deleteBtn = $(`<td><button class="btn btn-danger delete-btn" data-toggle="modal" data-target="#delete-dialog" data-contract="${address.toLowerCase()}">Delete</button></td>`);
                    deleteBtn.find('button').prop("disabled", isActive);
                    tr.prepend(deleteBtn);
                }
            })
            .catch(dispError);
        })
        .catch(() => {
            tr.append($(`<td style="font-family:Monospace;">${address.toLowerCase()}</td>`));
            tr.addClass('bg-danger');
            tr.append($(`<td><strong>This SmartLease has been destroyed and is no longer available to view!</strong></td>`));
            tr.prepend($(`<td></td>`));
            tr.prepend($(`<td></td>`));
        })
        .then(() => {
            tr.appendTo($(table_id_name));                
        })
    };
}