
const { https } = require('follow-redirects');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch-commonjs');
const cliProgress = require('cli-progress');

function downloadLib(url, path) {
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  let receivedBytes = 0
  console.log("download lib:", url);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path);
    https.get(url, function (resp) {

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
  const rootDir = path.resolve(__dirname, "..");
  const libDir = path.join(rootDir, "lib");
  fs.mkdirSync(libDir, { recursive: true });
  try {
    const resp = await fetch("https://api.github.com/repos/PoloDB/PoloDB/releases/latest");
    const data = await resp.json();
    const { tag_name: tagName, assets } = data;
    const downloadAssets = findAssets(assets);
    console.log("Download:", tagName);

    for (const asset of downloadAssets) {
      const url = asset.browser_download_url;
      const downloadPath = path.join(libDir, asset.name);
      await downloadLib(url, downloadPath);
    }
  } catch (err) {
    console.error(err);
    process.exit(-1);
  }
}

main();
