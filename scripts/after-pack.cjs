const { execSync } = require('node:child_process');

// Electron's own binaries ship with com.apple.provenance extended
// attributes, which make `codesign` fail with "resource fork, Finder
// information, or similar detritus not allowed". Strip them from the staged
// app before electron-builder signs it. Runs on all platforms via afterPack.
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appOutDir = context.appOutDir;
  try {
    execSync(`xattr -cr ${JSON.stringify(appOutDir)}`, { stdio: 'ignore' });
    console.log(`after-pack: cleared extended attributes in ${appOutDir}`);
  } catch (err) {
    console.warn('after-pack: xattr cleanup failed:', err.message);
  }
};