# VAHANOVA AI Assistant setup

The AI assistant uses the xAI Grok API. The browser calls the VAHANOVA server route; the xAI key is never sent to the browser.

## Configure the server key

1. Create an API key in the xAI Console.
2. In the Vercel project, open **Settings → Environment Variables**.
3. Add `XAI_API_KEY` with the key value. Select the environments where the assistant should run (Preview and Production as appropriate).
4. Optionally add `XAI_MODEL` with `grok-4.6`. If omitted, the server defaults to `grok-4.6`.
5. Redeploy after saving the environment variables.

For local development, put the same variables in the ignored `.env.local` file at the project root.

**Never** put the key in a `NEXT_PUBLIC_*` variable, source code, screenshots, chat messages, or a committed file. The xAI API is usage-billed; check the xAI Console usage and limits.

If the key is not configured, the assistant shows a friendly unavailable message and the rest of VAHANOVA continues to work.
