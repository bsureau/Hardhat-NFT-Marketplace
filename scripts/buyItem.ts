import { ContractTransaction } from "ethers";
import { ethers, network } from "hardhat";
import { NftMarketplace } from "../typechain-types/contracts/NftMarketplace";
import { BasicNft } from "../typechain-types/contracts/test/BasicNft";
import { moveBlocks } from "../utils/move-blocks";

const TOKEN_ID = 8;

async function buyItem() {
  const nftMarketplace: NftMarketplace = await ethers.getContract(
    "NftMarketplace"
  );
  const basicNft: BasicNft = await ethers.getContract("BasicNft");
  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
  const price = listing.price.toString();
  const tx: ContractTransaction = await nftMarketplace.buyItem(
    basicNft.address,
    TOKEN_ID,
    {
      value: price,
    }
  );
  await tx.wait(1);
  console.log("NFT Bought!");
  if (network.config.chainId === 31337) {
    await moveBlocks(2, 1000);
  }
}

buyItem()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
