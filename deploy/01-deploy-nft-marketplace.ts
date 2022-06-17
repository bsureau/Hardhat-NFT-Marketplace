import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } from '../helper-hardhar-config';
import { verify } from '../utils/verify';

const deployNftMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  const { deployments, getNamedAccounts, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS

  console.log('ADDRESS', deployer)
  log("----------------------------------------------------")
  const args: any[] = []
  const nftMarketplace = await deploy('NftMarketplace', {
      from: deployer,
      args: args, 
      log: true, 
      waitConfirmations: waitBlockConfirmations
    }
  )

  // Verify the deployment on Etherscan
  if (!developmentChains.includes(network.name)) {
    log("Verifying...")
    await verify(nftMarketplace.address, args)
  }
  log("----------------------------------------------------")
};

deployNftMarketplace.tags = ["all", "nftmarketplace"]
export default deployNftMarketplace
