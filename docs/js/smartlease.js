const FactoryAddress = '0x8f0483125fcb9aaaefa9209d8e9d7b9c8b9fb90f';
const FactoryURI = '../build/contracts/SmartLeaseFactory.json';
const SmartLeaseURI = '../build/contracts/SmartLease.json';

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
            return reject(new Error("Please install MetaMask. If MetaMask is already installed please unlock your accounts."));
        }
        web3js = new Web3(web3.currentProvider);
        return resolve();
    });
}

function getContractABI(uri) {
    return new Promise((resolve, reject) => {
        $.getJSON(uri)
        .done(json => {return resolve(json.abi)})
        .fail((xhr, status, err) => {return reject(err)});
    });
}

function loadContracts() {
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
    setInterval(checkUser, 5000);
}

function checkUser() {
    web3js.eth.getAccounts()
    .then(accts => {
        if (userAccount !== accts[0]) {
            userAccount = accts[0];
            updateUI();
        }
    });
}

function updateUI() {
    $('tbody').empty();
    Factory.getPastEvents('NewLease', {filter: {landlord: userAccount}, fromBlock: 0, toBlock: 'latest'})
    .then((logs) => {
        return logs.map((log) => log.returnValues.contract_address);
    })
    .then((addresses) => {
        addresses.forEach((address) => {
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
                tr.appendTo('tbody');                
            })
            .catch(dispError);
        });
    })
    .catch(dispError);
}

function dispError(error) {
    console.log(error);
}