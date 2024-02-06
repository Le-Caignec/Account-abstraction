import { ethers, upgrades } from "hardhat";
import {
  POCO_APP_REGISTRY_ADDRESS,
  POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
  POCO_PROXY_ADDRESS,
} from "../config/config";

async function main() {
  console.log("Starting deployment...");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // pass the registry instance to the deploy method
  const ProtectedDataSharingFactory = await ethers.getContractFactory(
    "ProtectedDataSharing"
  );
  const proxy = await upgrades.deployProxy(
    ProtectedDataSharingFactory,
    [
      POCO_PROXY_ADDRESS,
      POCO_APP_REGISTRY_ADDRESS,
      POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
      deployer.address,
    ],
    { kind: "transparent" }
  );
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  console.log(`Proxy address: ${proxyAddress}`);
  console.log(
    "Implementation address (ProtectedDataSharing.sol):",
    await upgrades.erc1967.getImplementationAddress(proxyAddress)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
