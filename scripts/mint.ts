import { ethers, network } from "hardhat";
import { BasicNft } from "../typechain-types/contracts/test/BasicNft";
import { moveBlocks } from "../utils/move-blocks";

async function mintAndList() {
  const basicNft: BasicNft = await ethers.getContract("BasicNft");
  console.log("Minting NFT...");
  const mintTx = await basicNft.mintNft();
  const mintTxReceipt = await mintTx.wait(1);
  console.log(
    `Minted tokenId ${mintTxReceipt?.events?.[0].args?.tokenId.toString()} from contract: ${
      basicNft.address
    }`
  );
  if (network.config.chainId == 31337) {
    // Moralis has a hard time if you move more than 1 block!
    await moveBlocks(2, 1000);
  }
}

mintAndList()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
