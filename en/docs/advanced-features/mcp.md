# MCP Service

MCP lets an AI read configuration, edit plans and queues, start or stop tasks, and check runtime status and history. Available actions depend on the tools actually listed by the client. Deletion, cleanup, publishing, login, and application updates are not automatically exposed.

MCP (Model Context Protocol) is a common interface for AI to call external tools. You do not need to know how it works. Just put the address below into your AI client.

## Configuration

- Keep AUTO-MAS running, select **Tools** in the left navigation, and open the **MCP service** tab at the top of the page.
- Wait until the service is ready, then copy the **service address** shown on the page.
- Add it to an MCP client that supports **Streamable HTTP**.

Installed builds default to `http://127.0.0.1:36163/mcp`; source development defaults to port `36164`. The port may vary by instance, so use the address displayed in Tools.

For clients that accept the `mcpServers` / `url` format, the configuration looks like this. Check your client's instructions for its configuration entry and support for local HTTP servers:

```json
{
  "mcpServers": {
    "auto-mas": {
      "url": "http://127.0.0.1:36163/mcp"
    }
  }
}
```

::: info Version and demonstration scope
The Chinese-interface screenshot uses **dev after v5.8.0-beta.3 (3c9448bdf)** and a real isolated backend. The service was ready with available tools and remained ready after reload. No tools were called through an AI client. The shown port belongs to the demonstration instance; use the address on your own Tools page.
:::

[![Ready MCP service and its address](/docs/img/tutorial-context-20261105-3c9448bdf/mcp-ready.png)](/docs/img/tutorial-context-20261105-3c9448bdf/mcp-ready.png)

The numbers mark **viewing items**, not a sequence of clicks:

- **①Service status**: it should show ready.
- **②Service address**: use the address shown by your instance; its port can differ from the example.
- **③Available tool count**: the service offers tools. This does not prove an AI client has connected or executed a task.

## Usage

Once it is set up, **keep AUTO-MAS running**. The AI connects on its own, and from there you direct it in plain language.

The service loads after the main application is ready. Wait while loading; if it fails, read the message in Tools and use **Reload**. Include the relevant logs if further troubleshooting is needed.

::: warning The AI cannot connect if AUTO-MAS is not running
That address is a service AUTO-MAS provides itself. Close the app and the service goes with it, so the AI will report a connection failure.
:::
