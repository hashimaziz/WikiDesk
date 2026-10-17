const { execFileSync } = require('node:child_process');
const path = require('node:path');

/**
 * macOS ad-hoc signing.
 *
 * electron-builder's own signing step fails on Electron's shipped binaries
 * ("resource fork, Finder information, or similar detritus not allowed"),
 * because they carry com.apple.provenance extended attributes that get
 * re-applied while the app is being staged. `build.mac.identity` is therefore
 * set to null and the sign step happens here instead: strip extended
 * attributes, then ad-hoc sign the whole bundle.
 *
 * Ad-hoc signing is enough to run locally and satisfies macOS's requirement
 * that arm64 binaries be signed. Distributing to other machines still needs a
 * real Developer ID certificate plus notarization:
 *   npx electron-builder --mac -c.mac.identity="Developer ID Application: …"
 */
exports.default = async function afterSign(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);

  const run = (args) =>
    execFileSync(args[0], args.slice(1), { stdio: 'ignore' });

  try {
    run(['xattr', '-cr', appPath]);
    run([
      'codesign',
      '--force',
      '--deep',
      '--sign',
      '-',
      '--options',
      'runtime',
      appPath,
    ]);
    run(['codesign', '--verify', '--deep', '--strict', appPath]);
    console.log(`after-sign: ad-hoc signed and verified ${appPath}`);
  } catch (err) {
    console.warn('after-sign: ad-hoc signing failed:', err.message);
  }
};