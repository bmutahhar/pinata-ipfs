// Import libraries and utils
const pinataSDK = require("@pinata/sdk");
const dotenv = require("dotenv");
const utils = require("./utils");
const config = require("./config");

dotenv.config();

// Pinata API keys
const pinataAPIKey = process.env.pinataAPIKey;
const pinataSecretAPIKey = process.env.pinataSecretAPIKey;

const pinata = pinataSDK(pinataAPIKey, pinataSecretAPIKey);

// Main function calling other util functions
const run = async () => {
  console.log("[+] Reading all images paths from the folder");
  // Read all the images from the given folder
  utils.readDirectoryRecursively(config.inputFolderPath);
  const files = utils.getFiles();
  console.log("[+] Reading CSV file");
  // Read CSV file
  const csvData = await utils.readCSVFile(config.csvInputPath);
  // Main function holding all the logic to upload images to pinata
  await utils.searchAndUploadImage(
    pinata,
    files,
    csvData,
    config.outputFolderPath
  );
};

run();
