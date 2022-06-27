#!/usr/bin/env bash

if [ ! -d "$HOME/.kube" ]; then
	mkdir -p $HOME/.kube
fi

echo "$BASE64_KUBE_CONFIG" $HOME/.kube/config.b64
cat $HOME/.kube/config.b64 | base64 -d > $HOME/.kube/config
