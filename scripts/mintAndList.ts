import { BigNumber } from "@ethersproject/bignumber";
import { BasicNft } from "../typechain-types/contracts/test/BasicNft";
import { ethers, network } from "hardhat";
import { ContractReceipt, ContractTransaction } from "ethers";
import { moveBlocks } from "../utils/move-blocks";

const PRICE: BigNumber = ethers.utils.parseEther("0.1");

async function mintAndList() {
  const nftMarketplace = await ethers.getContract("NftMarketplace");
  const basicNft: BasicNft = await ethers.getContract("BasicNft");

  console.log("Minting NFT...");
  const mintTx: ContractTransaction = await basicNft.mintNft();
  const mintTxReceipt: ContractReceipt = await mintTx.wait(1);
  const tokenId = mintTxReceipt?.events?.[0].args?.tokenId;
  console.log("Approving NFT...");
  const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId);
  await approvalTx.wait(1);
  console.log("Listing NFT...");
  const tx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE);
  await tx.wait(1);
  console.log("NFT Listed!");

  if (network.config.chainId == 31337) {
    // Moralis has a hard time if you move more than 1 at once!
    await moveBlocks(1, 1000);
  }
}

mintAndList()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
