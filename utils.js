// Essential library imports
const path = require("path");
const fs = require("fs");
const csv = require("fast-csv");
const files = [];

// Function to get the paths of all the images in the given folder
const readDirectoryRecursively = (root) => {
  const filesInDirectory = fs.readdirSync(root);
  filesInDirectory.forEach((file) => {
    const absolute = path.join(root, file);
    if (fs.statSync(absolute).isDirectory()) {
      readDirectoryRecursively(absolute);
    } else {
      files.push(absolute);
    }
  });
};

// Getter method to get the images paths from the above function
const getFiles = () => files;

// Function to read csv file
const readCSVFile = async (path) => {
  return new Promise((resolve, reject) => {
    const data = [];
    csv
      .parseFile(path, { headers: true, delimiter: "," })
      .on("error", (error) => reject(error))
      .on("data", (row) => data.push(row))
      .on("end", (count) => {
        resolve(data);
      });
  });
};

// Function to write CSV file after updating it
const writeCSVFile = (folderPath, data) => {
  const outputFilePath = path.join(folderPath, "Updated Data File.csv");
  return new Promise((resolve, reject) => {
    csv
      .writeToPath(outputFilePath, data, { headers: true })
      .on("error", (error) => reject(error))
      .on("finish", () => resolve("done"));
  });
};

// Function to get the image path, upload it, and save it's corresponding url to the csv file
const searchAndUploadImage = async (
  pinata,
  files,
  csvData,
  outputFolderPath
) => {
  const outputData = [];
  // const data = csvData.slice(0, 15);
  try {
    // Check if Images folder exists, if not, create one
    if (!fs.existsSync(path.join(outputFolderPath, "Images"))) {
      console.log("[+] Creating Images folder");
      fs.mkdirSync(path.join(outputFolderPath, "Images"));
    }

    // Iterate over the csv file one by one
    for ([index, record] of csvData.entries()) {
      console.log(
        `Processing image ${index} of ${csvData.length}: ${record.img}`
      );
      // Find the complete file path using the filename from the CSV record
      // Search the image in the folder and get it's complete path
      const filePath = files.find((file) => {
        if (fs.statSync(file).isFile()) {
          return (
            path.basename(file).trim().toLowerCase() ===
            record.img.trim().toLowerCase()
          );
        }
      });
      // Get only filename from the complete path
      let fileName = path.basename(filePath);
      // Rename file with INDEX and file extention like .jpg, .png etc from the file name
      fileName = `${index}.${fileName.split(".")[1].trim()}`;
      // Create output file path to copy and rename the file
      const outputFilePath = path.join(outputFolderPath, "Images", fileName);
      // Copy the file from source image folder to the output folder
      fs.copyFileSync(filePath, outputFilePath);
      // Create readable stream for file
      const imgStream = fs.createReadStream(outputFilePath);
      // Upload file to ipfs and pin to pinata
      const fileHash = await pinata.pinFileToIPFS(imgStream, {
        pinataOptions: {
          wrapWithDirectory: true,
        },
      });
      //  Create complete file URL using the file hash and filename
      const fileURL = `https:///gateway.pinata.cloud/ipfs/${fileHash.IpfsHash}/${fileName}`;
      console.log(fileURL);
      // Add file url to the csv record
      record.img_url = fileURL;
      // Append updated record to output array
      outputData.push(record);
      // Write output array to the updated CSV file
      writeCSVFile(outputFolderPath, outputData)
        .then(() => {
          console.log("Writing file for ", index);
        })
        .catch((err) => {
          console.log(err);
        });
    }
    console.log("All Images Uploaded!");
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  readDirectoryRecursively,
  getFiles,
  readCSVFile,
  writeCSVFile,
  searchAndUploadImage,
};
