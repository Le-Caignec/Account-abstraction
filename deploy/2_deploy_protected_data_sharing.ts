import { ethers, upgrades } from "hardhat";
import {
  POCO_APP_REGISTRY_ADDRESS,
  POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
  POCO_PROXY_ADDRESS,
} from "../config/config";

export async function deployProtectedDataSharing() {
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
  console.log("==ProtectedDataSharing==", proxyAddress);

  return {
    ProtectedDataSharingAddress: proxyAddress,
  };
}