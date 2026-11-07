# VAHANOVA AI Assistant setup

The AI assistant uses Groq's API with a free-tier supported model by default. The browser calls the VAHANOVA server route; the API key is never sent to the browser.

## Configure the server key

1. Have the project owner/guardian create and manage the Groq API account and key.
2. In the Vercel project, open **Settings → Environment Variables**.
3. Add `GROQ_API_KEY` with the key value. Select the environments where the assistant should run (Preview and Production as appropriate).
4. Optionally add `GROQ_MODEL` with `openai/gpt-oss-20b`. If omitted, the server defaults to this model.
5. Redeploy after saving the environment variables.

For local development, put the same variables in the ignored `.env.local` file at the project root.

**Never** put the key in a `NEXT_PUBLIC_*` variable, source code, screenshots, chat messages, or a committed file.

Groq offers a Free plan with model-specific rate limits. Free use is not unlimited: when the quota is reached, the API may return HTTP 429 until the limit resets. Check the current model availability and exact limits in the Groq Console. Do not upgrade to a paid plan just to make this feature work.

If the key is not configured, the assistant shows a friendly unavailable message and the rest of VAHANOVA continues to work.
