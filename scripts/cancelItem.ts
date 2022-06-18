import { ContractTransaction } from "ethers";
import { ethers, network } from "hardhat";
import { NftMarketplace } from "../typechain-types/contracts/NftMarketplace";
import { BasicNft } from "../typechain-types/contracts/test/BasicNft";
import { moveBlocks } from "../utils/move-blocks";

const TOKEN_ID = 0;

async function cancelItem() {
  const nftMarketplace: NftMarketplace = await ethers.getContract(
    "NftMarketplace"
  );
  const basicNft: BasicNft = await ethers.getContract("BasicNft");
  const tx: ContractTransaction = await nftMarketplace.cancelListing(
    basicNft.address,
    TOKEN_ID
  );
  await tx.wait(1);
  console.log("Nft canceled!");

  if (network.config.chainId === 31337) {
    await moveBlocks(2, 1000);
  }
}

cancelItem()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
