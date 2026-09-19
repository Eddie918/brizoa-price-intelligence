# Security policy

## Secrets

- Keep `APIFY_TOKEN` only in the hosting provider's encrypted environment variables.
- Never expose it through a `NEXT_PUBLIC_` variable, client bundle, log, screenshot, issue, or commit.
- Use `.env.local` for local development; it is ignored by Git.
- If a token is exposed, revoke it in Apify and replace the hosting secret immediately.

## Reporting a vulnerability

Please report vulnerabilities privately to `saul.ariasst@gmail.com`. Do not open a public issue containing credentials or personal data.
