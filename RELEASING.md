# Releasing parsi-mcp (maintainer guide, Windows PowerShell)

Checked against the official docs: docs.npmjs.com (publishing, 2FA, tokens) and the MCP Registry quickstart and package-types pages (registry.modelcontextprotocol.io).

## 0. One-time setup
1. Create an npm account at https://www.npmjs.com/signup and verify your email.
2. Turn on two-factor authentication: npmjs.com, profile picture, Account, Two-Factor Authentication. Use an authenticator app or a security key. Publishing requires 2FA.
3. Install Node.js 18+ (check with `node -v`).
4. Classic npm tokens no longer exist. `npm login` gives a 2-hour session and asks for 2FA when you publish. Only use a granular token with "Bypass 2FA" for CI, and never commit it.

## 1. Check the release
```powershell
cd C:\Users\AmirHossein\Desktop\Work\open-source\parsi-mcp
git pull
npm ci
npm run build
npm test
npm run docs:tools        # TOOLS.md must not change (git status stays clean)
npm pack --dry-run        # look at the file list
```

Versions must match in `package.json`, `server.json` (two `version` fields), `.claude-plugin/plugin.json` (the `version` and the pinned `parsi-mcp@x.y.z`) and `VERSION` in `src/server.ts`.

## 2. Publish to npm
```powershell
npm login                          # opens the browser; complete 2FA
npm whoami                         # shows your npm username
npm publish --access public
```
`prepublishOnly` rebuilds and runs the tests first. If npm asks for a one-time password, enter the code from your authenticator app. `--access public` is harmless for an unscoped package.

Verify (wait a minute for the registry to update):
```powershell
npm view parsi-mcp version
cd $env:TEMP
npx -y parsi-mcp          # starts the stdio server and waits; press Ctrl+C to stop
```
Open https://www.npmjs.com/package/parsi-mcp to see the page.

## 3. Publish to the MCP Registry
The package must already be on npm: the registry checks that `mcpName` in the published `package.json` equals `name` in `server.json` (`io.github.amirjld/parsi-mcp`). With GitHub login the name must start with `io.github.amirjld/`.

Install the CLI (PowerShell):
```powershell
$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -eq "Arm64") { "arm64" } else { "amd64" }
Invoke-WebRequest -Uri "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_windows_$arch.tar.gz" -OutFile "mcp-publisher.tar.gz"
tar xf mcp-publisher.tar.gz mcp-publisher.exe
rm mcp-publisher.tar.gz
```
Put `mcp-publisher.exe` in a folder on your PATH (or run it as `.\mcp-publisher.exe` from the repo folder, but do not commit it).

```powershell
.\mcp-publisher.exe validate         # optional: checks server.json
.\mcp-publisher.exe login github     # shows a code, open https://github.com/login/device, enter it, authorize
.\mcp-publisher.exe publish
```
Verify:
```powershell
curl.exe "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.amirjld/parsi-mcp"
```
The registry is in preview, so details may change; see https://modelcontextprotocol.io/registry/quickstart.

## 4. Tag and create a GitHub release
```powershell
git tag v0.3.0
git push origin v0.3.0
```
Then on GitHub: repo, Releases, "Draft a new release", pick tag `v0.3.0`, "Generate release notes", Publish. (Or with the GitHub CLI: `gh release create v0.3.0 --generate-notes`.)

## 5. Next releases
Bump the versions listed in step 1, run `npm run docs:tools`, commit, push, then repeat steps 2 to 4. npm never lets you re-publish the same version.
