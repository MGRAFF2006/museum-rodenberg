# One-shot self-hosted schema pushes

The existing npm commands push functions, indexes and schema to an explicitly
selected self-hosted deployment:

```bash
npm run convex:push
npm run convex:push:prod
bash scripts/push-convex.sh --help
```

Local selection requires `CONVEX_SELF_HOSTED_URL` and
`CONVEX_SELF_HOSTED_ADMIN_KEY`; production selection requires `CONVEX_PROD_URL`
and `CONVEX_PROD_ADMIN_KEY`. Set them in your ignored `.env.local`/`.env` or
process environment. Precedence is flags, process environment, `.env.local`, then
`.env`. Custom local ports and production hostnames work without special matching.
Commented credentials are never selected. Unknown flags and missing values fail.

For compatibility, both `--url URL --key KEY` and `--url=URL --key=KEY` work.
Prefer environment/file keys: explicit key arguments can remain in shell history
and be visible in the wrapper's process arguments. Keys are not forwarded to the
Convex subprocess as arguments, printed or saved to a temporary credential file.

The wrapper invokes the installed `convex deploy` command with explicit
self-hosted URL/key environment variables and required backend typechecking,
clearing unrelated cloud deployment selectors. A type error must stop publishing.
Unlike `convex dev --once`, `deploy` does not reconfigure the frontend
or write `.env.local`, so existing local URLs, formatting and file absence are
preserved on success, failure or interruption. CLI output is suppressed because
diagnostics can contain credentials; wrapper errors identify exit status/signal.
SIGINT/SIGTERM are forwarded to the child and return a failing exit status.
Generated Convex code may still be updated by the normal deploy/codegen behavior.

This command deploys immediately to the chosen backend. `--prod` is a target
selection, not a dry run. Interrupted or failed deployment can still have reached
the server; check deployment status before retrying. Production writes require
your deliberate deployment decision. The fixture tests never run real deployment:

```bash
node --test scripts/__tests__/push-convex.test.mjs
```

The implementation was checked against installed Convex 1.32's deploy and
deployment-selection code plus its `deploy --help`; see the
[Convex CLI documentation](https://docs.convex.dev/cli/overview).
