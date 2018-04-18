const FactoryAddress = '0x345ca3e014aaf5dca488057592ee47305d9b3e10';
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
            return Promise.reject();
        }
        $('#not-tenant-alert').hide();
        return logs.map((log) => log.returnValues.contract_address);
    })
    .then((addresses) => {
        addresses.forEach(getSmartLeaseDataForTenant);
    });
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
    });
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
            'googlePropertyId',
            // 'isValid',
            // 'isSigned'
        ];
        let tr = $(document.createElement('tr'));
        Promise.all(methods.map((method) => {
            return smartlease.methods[method + '()']().call();
        }))
        .then((results) => {
            results.forEach(text => tr.append($(`<td>${text}</td>`)));
        })
        .then(() => {
            tr.appendTo($(table_id_name));                
        })
        .catch(dispError);
    }
}