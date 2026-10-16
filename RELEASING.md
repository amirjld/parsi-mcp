# Releasing parsi-mcp (maintainer notes)

1. `npm ci && npm run build && npm test` must pass.
2. Bump the version in `package.json`, `server.json` (both `version` fields), `.claude-plugin/plugin.json` (version and the pinned `parsi-mcp@x.y.z`), and `VERSION` in `src/server.ts`.
3. `npm login`, then `npm publish --access public`.
4. Register in the MCP Registry (requires the package to be on npm first):
   `mcp-publisher login github`, then `mcp-publisher publish` (`server.json` name `io.github.amirjld/parsi-mcp` matches `mcpName` in `package.json`).
5. `git tag vX.Y.Z && git push origin vX.Y.Z`.
