# mcp-walkscore

Walk Score MCP — wraps the Walk Score API (walkscore.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `walkscore_score` | How walkable is <address> — Walk/Transit/Bike Score (0-100) plus a human-readable description of walkability, transit, and biking. NOTE: the Walk Score API requires lat AND lon AND address to all be provided — the coordinates locate the point and the address disambiguates it. Example: walkscore_score({ address: "1119 8th Avenue, Seattle, WA 98101", lat: 47.6085, lon: -122.3295, transit: true, bike: true, _apiKey: "your-key" }) |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "walkscore": {
      "url": "https://gateway.pipeworx.io/walkscore/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Walkscore data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
