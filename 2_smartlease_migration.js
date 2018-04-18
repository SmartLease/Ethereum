var SmartLease = artifacts.require("SmartLease");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(SmartLease, "first", "last");
};
