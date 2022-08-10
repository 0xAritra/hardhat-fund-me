const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe
          let mockV3Aggregator
          let deployer
          const sendValue = ethers.utils.parseEther("0.5")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function () {
              it("should set aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("should fail if enough ETH is not sent!", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith("not enough!")
              })
              it("should update the funded mapping", async function () {
                  await fundMe.fund({ value: sendValue })
                  const res = await fundMe.getAddressToAmountFunded(deployer)
                  assert.equal(res.toString(), sendValue.toString())
              })
              it("should update the funder array", async function () {
                  await fundMe.fund({ value: sendValue })
                  const res = await fundMe.getFunder(0)
                  assert.equal(res.toString(), deployer)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("should withdraw from one funder!", async function () {
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  // breakpoint - check gas
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasPrice = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasPrice).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  )
              })

              it("should withdraw from multiple funders!", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const connectedFundMe = await fundMe.connect(accounts[i])
                      await connectedFundMe.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasPrice = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasPrice).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  )
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("should only allow owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnected = await fundMe.connect(accounts[1])
                  await expect(
                      fundMeConnected.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("cheaperWithdraw - one funder!", async function () {
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  // breakpoint - check gas
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasPrice = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasPrice).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  )
              })

              it("cheaperWithdraw - multiple funders!", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const connectedFundMe = await fundMe.connect(accounts[i])
                      await connectedFundMe.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasPrice = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  //
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasPrice).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  )
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
