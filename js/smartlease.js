const FACTORYADDRESS = 'temp';
const FACTORYABIPATH = 'build/contracts/SmartLeaseFactory.json';
const SMARTLEASEABIPATH = 'build/contracts/SmartLease.json'

var SmartLeaseFactory;
var SmartLease;

var factoryInstance;


let userAccount;


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
    .then(createFactory)
    .then(connectToFactory)
    .then(createSmartLease)
    .then(getUserContracts)
    .then(updateContractsTable)
    .catch(handleError)
});

function checkForMetaMask() {
    if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
        userAccount = web3.eth.accounts[0];
        setInterval(checkForUserAccountChange, 100);
        return new Promise.resolve();
    } else {
        return new Promise.reject(new Error("Please install MetaMask"));
    }
}

function checkForUserAccountChange() {
    if (web3.eth.accounts[0] !== userAccount) {
        userAccount = web3.eth.accounts[0];
    }
}

function createFactory() {
    return createContract(FACTORYABIPATH)
    .then(function(_abi) {
        SmartLeaseFactory = new web3.eth.contract(_abi);
        return Promise.resolve(SmartLeaseFactory);
    });
}

function createSmartLease() {
    return createContract(SMARTLEASEABIPATH)
    .then(function(_abi) {
        SmartLease = new web3.eth.contract(_abi);
        return Promise.resolve(SmartLease);
    });
}

function createContract(_abiPath) {
    return getContractABI(_abiPath);
}

function connectToFactory(_contract) {
    factoryInstance = connectToContract(_contract, FACTORYADDRESS);
    return Promise.resolve();
}

function connectToContract(_contract, _address) {
    return _contract.at(_address);
}

function getContractABI(_abiPath) {
    return $.getJSON(_abiPath)
    .then(function(_abi) {
        return Promise.resolve(_abi);
    })
    .catch(function(err) {
        throw new Error("Could not connect to factory:" + err);
    });
}

function getUserContracts(_userAccount) {
    return getAllEventsByUserAccount(_userAccount)
}

function getAllEventsByUserAccount(_userAccount) {
    let newUserLeases = factoryContract.newLease({landlord: _userAccount}, {fromBlock: 0, toBlock: 'latest'});
    return new Promise(function(resolve, reject) {
        newUserLeases.get(function(err, logs) {
            if (err) {
                reject(err);
            }
            resolve(logs);
        })
    });
}

function updateContractsTable(_logs) {
    if (_logs.length == 0) {
        return new Promise.reject(new Error("No contracts associated with current user"));
    }
    return Promise.all(_logs.map(connectToLease))
    .then(function(leases) {
        leases.forEach(function(lease) {
            lease.then(function(leaseAttributes) {
                leaseAttributes.forEach(function(attribute) {
                    
                })
            })
        })
    }
}

function connectToLease(_log) {
    let leaseInstance = SmartLease.at(_log.args.contract_address);
    return Promise.all([
        'landlord',
        'numTenants',
        'maxTenants',
        'startDate',
        'endDate',
        'securityDeposit',
        'googlePropertyId',
        'isValid',
        'isSigned'
    ].map(function(method) {
        return new Promise(function(resolve, reject) {
            leaseInstance[method].call(genCbContractProperty(method));
        });
    })
)}

function genCbContractProperty(_method) {
    return function(err, result) {
        if (err) {
            return Promise.reject(new Error("Could not get property: " + err));
        }
        return Promise.resolve([_method, result]);
    };
}