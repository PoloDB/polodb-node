
const { https } = require('follow-redirects');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const fetch = require('node-fetch-commonjs');
const cliProgress = require('cli-progress');
// const dist = require('../dist');

// const version = '2.0.0';

// const platform = os.platform();
// const arch = os.arch();
// const binName = platform === 'win32' ? 'polodb.exe' : 'polodb';
// const downloadUrl = `https://www.polodb.org/resources/${version}/bin/${platform}/${arch}/${binName}`;
// const downloadChecksumUrl = `${downloadUrl}.SHA256`;

// function getDownloadPath() {
//   const tmpDir = os.tmpdir();
//   const projectDir = path.join(tmpDir, version, binName);
//   if (!fs.existsSync(projectDir)) {
//     fs.mkdirSync(projectDir, {
//       recursive: true,
//     });
//   }
//   const nodeFilePath = path.join(projectDir, binName);
//   return nodeFilePath;
// }

// function downloadChecksumFile() {
//   return new Promise((resolve, reject) => {
//     const checksumPath = getDownloadPath() + '.SHA256';
//     const file = fs.createWriteStream(checksumPath);
//     https.get(downloadChecksumUrl, function(resp) {
//       resp.pipe(file);
//       resp.on('error', err => {
//         reject(err);
//       });
//       resp.on('end', () => {
//         if (resp.complete) {
//           resolve(checksumPath);
//         }
//       });
//     });

//   });
// }

function downloadLib(url, path) {
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  let receivedBytes = 0
  console.log("download lib:", url);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path);
    https.get(url, function (resp) {
      // if (resp.statusCode !== 200) {
      //   return reject('Response status was ' + resp.statusCode);
      // }

      const totalBytes = resp.headers['content-length'];
      progressBar.start(totalBytes, 0);
      console.log("totalBytes", totalBytes, "statusCode:", resp.statusCode);

      resp.on('data', (chunk) => {
        receivedBytes += chunk.length;
        progressBar.update(receivedBytes);
      })
      resp.pipe(file);
      resp.on('error', err => {
        progressBar.stop();
        reject(err);
      });
      resp.on('end', () => {
        if (resp.complete) {
          progressBar.stop();
          resolve();
        }
      })
    });
  });
}

// function calsha256(filename) {
//   return new Promise((resolve, reject) => {
//     const sum = crypto.createHash('sha256');
//     const fileStream = fs.createReadStream(filename);
//     fileStream.on('error', function (err) {
//       return reject(err)
//     });
//     fileStream.on('data', function (chunk) {
//       try {
//         sum.update(chunk);
//       } catch (ex) {
//         return reject(ex);
//       }
//     });
//     fileStream.on('end', function () {
//       return resolve(sum.digest('hex'))
//     });
//   });
// };

// async function checksum(checksumFilePath, libPath) {
//   let checksumContent = fs.readFileSync(checksumFilePath, 'utf-8');
//   let actualChecksum = await calsha256(libPath);
//   return checksumContent === actualChecksum;
// }

const assetsMap = {
  "darwin-arm64": [
    "libpolodb_clib-darwin-arm64.a"
  ],
  "darwin-x64": [
    "libpolodb_clib-darwin-x64.a",
  ],
  "linux-x64": [
    "libpolodb_clib-linux-x64.a",
  ],
  "win32-x64": [
    "polodb_clib-win32-x64.lib"
  ],
}

function findAssets(assets) {
  const platformStr = `${process.platform}-${process.arch}`;
  const assetsArr = assetsMap[platformStr];
  if (!assetsArr) {
    return undefined;
  }
  const result = [];

  for (const asset of assets) {
    for (target of assetsArr) {
      if (asset.name === target) {
        result.push(asset);
      }
    }
  }

  return result;
}

async function main() {
  try {
    const resp = await fetch("https://api.github.com/repos/PoloDB/PoloDB/releases/latest");
    const data = await resp.json();
    const { tag_name: tagName, assets } = data;
    const downloadAssets = findAssets(assets);
    console.log("Download:", tagName);

    for (const asset of downloadAssets) {
      const url = asset.browser_download_url;
      await downloadLib(url, asset.name);
    }
  } catch (err) {
    console.error(err);
    process.exit(-1);
  }
}

// async function copyNodeToDest(nodeFilePath) {
// 	const binPath = path.join(__dirname, '..', 'bin');
//   if (!fs.existsSync(binPath)) {
//     fs.mkdirSync(binPath);
//   }
//   const target = path.join(binPath, binName);
//   fs.copyFileSync(nodeFilePath, target);
//   fs.chmodSync(target, 0755);

//   const version = await dist.PoloDbClient.version();
//   console.log('version: ', version);
// }

main();
