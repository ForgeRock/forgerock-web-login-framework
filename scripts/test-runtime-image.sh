#!/usr/bin/env bash
set -euo pipefail

image=${1:?Usage: scripts/test-runtime-image.sh IMAGE}

python3 - "$image" <<'PY_LAYERS'
import json
import subprocess
import sys
import tarfile
import tempfile
from pathlib import PurePosixPath

tools = {"go", "gofmt", "npm", "npx", "corepack", "pnpm", "pnpx", "yarn", "yarnpkg", "esbuild"}
packages = {"npm", "corepack", "pnpm", "yarn", "esbuild", "vite", "typescript", "playwright", "@playwright/test"}
layers = 0
with tempfile.TemporaryFile() as image:
    subprocess.run(["docker", "image", "save", sys.argv[1]], stdout=image, check=True)
    image.seek(0)
    with tarfile.open(fileobj=image) as archive:
        manifests = json.load(archive.extractfile("manifest.json"))
        for manifest in manifests:
            for name in manifest["Layers"]:
                layers += 1
                with tarfile.open(fileobj=archive.extractfile(name), mode="r|*") as layer:
                    for entry in layer:
                        path = PurePosixPath(entry.name.lstrip("./"))
                        parts = path.parts
                        forbidden = (
                            parts[:4] == ("usr", "local", "lib", "node_modules")
                            or parts[:3] == ("root", ".cache", "node")
                            or len(parts) > 1 and parts[0] == "opt" and parts[1].startswith("yarn-")
                            or (entry.isfile() or entry.issym() or entry.islnk()) and path.name in tools
                        )
                        if entry.isfile() and path.name == "package.json":
                            package = json.load(layer.extractfile(entry))
                            forbidden |= package.get("name") in packages
                        if forbidden:
                            raise SystemExit(f"Unexpected build tool in image layer: {path}")
print(f"Inspected {layers} image layers: no targeted package managers or build tools.")
PY_LAYERS

docker run --rm --read-only --network none --user 0 --entrypoint sh "$image" -ec '
  test "$PWD" = /app
  test "$(id -un 11111)" = app
  for tool in go npm npx corepack pnpm pnpx yarn yarnpkg; do
    if command -v "$tool"; then
      echo "Unexpected runtime build tool: $tool" >&2
      exit 1
    fi
  done
  test ! -e /usr/local/lib/node_modules
  test ! -e /root/.cache/node/corepack
  test ! -e /usr/src/app
  test ! -e /app/node_modules
  test -z "$(find /opt -maxdepth 1 -name "yarn-*")"
  test -z "$(find /app -type f -name esbuild)"
'

container=$(docker run -d --read-only --network none \
  -e FR_AM_URL=http://127.0.0.1:9/am \
  -e FR_AM_WELLKNOWN_URL=http://127.0.0.1:9/.well-known/openid-configuration \
  "$image")
trap 'docker rm -f "$container" >/dev/null' EXIT
test "$(docker exec "$container" id -u)" = 11111
test "$(docker exec "$container" id -g)" = 11111

for _ in {1..30}; do
  if docker exec "$container" node -e '
    fetch("http://localhost:3000/api/health/live")
      .then(async (response) => {
        if (!response.ok || (await response.json()).status !== "ok") process.exit(1);
      })
      .catch(() => process.exit(1));
  '; then
    echo "Runtime image starts as UID 11111 with a read-only filesystem and serves liveness without build tools."
    exit 0
  fi
  sleep 1
done

docker logs "$container"
exit 1
