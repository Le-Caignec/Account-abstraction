import pkg from "hardhat";
const { ethers, upgrades } = pkg;
import {
  POCO_APP_REGISTRY_ADDRESS,
  POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
  POCO_PROXY_ADDRESS,
} from "../config/config.js";

export async function deployProtectedDataSharing() {
  const [deployer] = await ethers.getSigners();

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
