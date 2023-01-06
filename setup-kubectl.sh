#!/usr/bin/env bash

curl -LO "https://dl.k8s.io/release/$KUBECTL_VERSION/bin/linux/amd64/kubectl"
curl -LO "https://dl.k8s.io/$KUBECTL_VERSION/bin/linux/amd64/kubectl.sha256"
echo "$(cat kubectl.sha256) kubectl" | sha256sum --check
rm -f kubectl.sha256

mkdir -p $RUNNER_TEMP/bin
mv kubectl $RUNNER_TEMP/bin
echo "$RUNNER_TEMP/bin" >> $GITHUB_PATH
