import { ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhar-config";
import { deployments } from "hardhat"
import { BasicNft } from "../../typechain-types/contracts/test/BasicNft"
import { NftMarketplace } from "../../typechain-types/contracts/NftMarketplace"
import { Signer } from 'ethers';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect, assert } from "chai";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NFT marketplace unit tests", function() {

        let nftMarketplace: NftMarketplace, basicNft: BasicNft
        const TOKEN_ID = 0
        const PRICE = ethers.utils.parseEther("0.1")
        let deployer: Signer, user: Signer

        beforeEach(async () => {
            const accounts: SignerWithAddress[] = await ethers.getSigners()
            deployer = accounts[0]
            user = accounts[1]
            await deployments.fixture(["all"])
            nftMarketplace = await ethers.getContract("NftMarketplace")
            basicNft = await ethers.getContract("BasicNft")
            await basicNft.mintNft()
            basicNft.approve(nftMarketplace.address, TOKEN_ID);
        })

        describe("List Item", function() {
            
            it("Emits an event after listing an item", async function() {
                expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                    nftMarketplace, 
                    "ItemListed"
                );
            })

            it("Reverts if price is not above zero", async function() {
                await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, ethers.utils.parseEther("0")))
                    .to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero");
            })

            it("Revert if items is already listed", async function () {
                await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                const error = `NftMarketplace__AlreadyListed("${basicNft.address}", ${TOKEN_ID})`
                 await expect(
                    nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                ).to.be.revertedWith(error)
            })

            it("Reverts if sender is not the owner of NFT", async function () {
                nftMarketplace = nftMarketplace.connect(user)
                await basicNft.approve(nftMarketplace.address, TOKEN_ID)
                await expect(
                    nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                ).to.be.revertedWith("NftMarketplace__NotOwner")
            })

            it("It reverts if NFT has not been approved", async function () {
                await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)

                await expect(
                    nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                ).to.be.revertedWith("NftMarketplace__NotApprovedForMarketplace")
            })

            it("Updates listing with seller and price", async function () {
                await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                assert.equal(listing.price.toString(), PRICE.toString())
                assert.equal(listing.seller.toString(), await deployer.getAddress())
            })
        })

        describe("cancelListing", function () {

            it("Reverts if there is no listing", async function () {
                const error = `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                await expect(
                    nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                ).to.be.revertedWith(error)
            })

            it("Reverts if anyone but the owner tries to call", async function () {
                await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                nftMarketplace = nftMarketplace.connect(user)
                await basicNft.approve(nftMarketplace.address, TOKEN_ID)
                await expect(
                    nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                ).to.be.revertedWith("NftMarketplace__NotOwner")
            })

            it("Emits an event and removes listing", async function () {
                await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                expect(await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                  nftMarketplace,
                    "ItemCanceled"
                )
                const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                assert.equal(listing.price.toString(), "0")
            })
        })

        describe("buyItem", function () {
            
            it("Reverts if the item isn't listed", async function () {
                await expect(
                    nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                ).to.be.revertedWith("NftMarketplace__NotListed")
            })

            it("Reverts if the price isnt met", async function () {
                await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                await expect(
                    nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                ).to.be.revertedWith("NftMarketplace__PriceNotMet")
            })

            it("transfers the nft to the buyer and updates internal proceeds record", async function () {
                await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                nftMarketplace = nftMarketplace.connect(user)
                expect(
                    await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                ).to.emit(nftMarketplace, "ItemBought")
                const newOwner = await basicNft.ownerOf(TOKEN_ID)
                const deployerProceeds = await nftMarketplace.getProceeds(await deployer.getAddress())
                assert.equal(newOwner.toString(), await user.getAddress())
                assert.equal(deployerProceeds.toString(), PRICE.toString())
            })
        })

        describe("updateListing", function () {
            
            it("Reverts if caller is not the owner or NFT is not listed", async function () {
                await expect(
                    nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
                ).to.be.revertedWith("NftMarketplace__NotListed")
                await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                nftMarketplace = nftMarketplace.connect(user)
                await expect(
                    nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
                ).to.be.revertedWith("NftMarketplace__NotOwner")
            })

            it("Updates the price of the item", async function () {
                const updatedPrice = ethers.utils.parseEther("0.2")
                await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                expect(
                    await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, updatedPrice)
                ).to.emit(nftMarketplace, "ItemListed")
                const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                assert.equal(listing.price.toString(), updatedPrice.toString())
            })
        })

        describe("withdrawProceeds", function () {
           
            it("Reverts if proceed withdrawls is equal to 0", async function () {
                await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith("NftMarketplace__NoProceeds")
            })

            it("Withdraws proceeds", async function () {
                await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                nftMarketplace = nftMarketplace.connect(user)
                await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                nftMarketplace = nftMarketplace.connect(deployer)

                const deployerProceedsBefore = await nftMarketplace.getProceeds(await deployer.getAddress())
                const deployerBalanceBefore = await deployer.getBalance()
                const txResponse = await nftMarketplace.withdrawProceeds()
                const transactionReceipt = await txResponse.wait(1)
                const { gasUsed, effectiveGasPrice } = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)
                const deployerBalanceAfter = await deployer.getBalance()

                assert.equal(
                    deployerBalanceAfter.add(gasCost).toString(), deployerProceedsBefore.add(deployerBalanceBefore).toString()
                )
            })
        })
    });
