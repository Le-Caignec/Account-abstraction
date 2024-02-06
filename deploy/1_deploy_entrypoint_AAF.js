import pkg from "hardhat";
const { ethers } = pkg;

export async function deploy() {
  // deploy EntryPoint
  const EntryPointFactory = await ethers.getContractFactory("EntryPoint");
  const entryPointContract = await EntryPointFactory.deploy();
  const entryPointAddress = await entryPointContract.getAddress();
  console.log("==EntryPoint==", entryPointAddress);

  // deploy Account Abstraction Factory
  const SimpleAccountFactoryFactory = await ethers.getContractFactory(
    "SimpleAccountFactory"
  );
  const simpleAccountFactoryContract = await SimpleAccountFactoryFactory.deploy(
    entryPointAddress
  );
  const simpleAccountFactoryAddress =
    await simpleAccountFactoryContract.getAddress();
  console.log("==AccountAbstractionFactory==", simpleAccountFactoryAddress);

  // deploy test contract
  const TestCounterFactory = await ethers.getContractFactory("TestCounter");
  const testCounterContract = await TestCounterFactory.deploy();
  const testCounterAddress = await testCounterContract.getAddress();
  console.log("==TestCounter==", await testCounterContract.getAddress());
}

deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
