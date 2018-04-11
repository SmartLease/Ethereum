var SmartLeaseFactory = artifacts.require("SmartLeaseFactory");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(SmartLeaseFactory);
};