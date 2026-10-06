# Local Compose isolation

Set `ADMIN_PASSWORD` explicitly in ignored `.env` or the process environment
before invoking Compose. Missing or empty values now stop configuration; there
is no built-in password fallback. Replace the public example password with your
own value. Compose may evaluate required interpolation even when selecting only
the backend, so this is a prerequisite for all local Compose commands.

The museum app remains published at port 3000. Its `/convex` endpoint resolves
against the browser's current origin, so opening the app through a LAN hostname
or HTTPS proxy does not send visitors to their own localhost. Direct host Vite
development retains the configured `VITE_CONVEX_URL` or local port 3210 fallback.

Convex ports 3210/3211, dashboard port 6791 and LibreTranslate port 5000 bind only
to `127.0.0.1`. Containers can still reach them through the Compose network. For
remote administration, use an explicit trusted SSH tunnel; these support services
are not intended as LAN/public endpoints. The museum app's published port should
be reachable only by the audience/network you intend to serve.

The one-shot schema setup mounts the checkout read-only at `/source`. It copies
the manifests and Convex directory into a temporary `/app`, installs the exact
lockfile with `npm ci` into the `convex-setup-deps` named volume, and uses the
non-configuring `convex deploy` command. Installation failure prevents deployment.
The Docker-only backend hostname and generated code remain inside the container;
host `.env.local`, package lock and node_modules are not rewritten. The temporary
workspace disappears with the container; the named dependency volume can be
removed/rebuilt as part of normal local maintenance.

Schema credentials still come from ignored `.env.local` through `env_file`.
Its `CONVEX_SELF_HOSTED_ADMIN_KEY` must be valid for the local backend; unrelated
cloud selectors are cleared by the setup container. Setup supports this project's
current self-contained `convex/` functions. If future functions import files from
outside that directory or add root Convex configuration files, update the explicit
copy list rather than making the host checkout writable again.

Verification performed without starting containers: Compose configuration checks,
loopback/volume assertions, a simulated installation failure that prevents the
deploy command, and frontend endpoint tests. Image startup, backend deployment
and access from a second device still require a deliberate local runtime check.
