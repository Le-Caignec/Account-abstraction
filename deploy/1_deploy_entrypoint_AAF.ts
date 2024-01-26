import { ethers } from "hardhat";

export async function deploy() {
  const provider = ethers.provider;
  const from = await provider.getSigner().getAddress();
  console.log(from);
  // deploy EntryPoint
  const EntryPointFactory = await ethers.getContractFactory("EntryPoint");
  const entryPointContract = await EntryPointFactory.deploy();
  console.log("==EntryPoint=", entryPointContract.address);

  // deploy Account Abstraction Factory
  const SimpleAccountFactoryFactory = await ethers.getContractFactory(
    "SimpleAccountFactory"
  );
  const simpleAccountFactoryContract = await SimpleAccountFactoryFactory.deploy(
    entryPointContract.address
  );
  console.log(
    "==AccountAbstractionFactory=",
    simpleAccountFactoryContract.address
  );

  // deploy test contract
  const TestCounterFactory = await ethers.getContractFactory("TestCounter");
  const testCounterContract = await TestCounterFactory.deploy();
  console.log("==TestCounter=", testCounterContract.address);

  return {
    EntryPointAddress: entryPointContract.address,
    AccountAbstractionFactoryAddress: simpleAccountFactoryContract.address,
    TestCounterAddress: testCounterContract.address,
  };
}

deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
