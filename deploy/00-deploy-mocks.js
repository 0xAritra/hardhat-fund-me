const { network } = require("hardhat")
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    // if (developmentChains.includes(network.name)) {}
    if (chainId == 31337) {
        log("local network! deploying mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        })
        log("deployed mocks!")
        log("----------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
