#!/usr/bin/env bash

if [ ! -d "$HOME/.kube" ]; then
	mkdir -p $HOME/.kube
fi

echo "$BASE64_KUBE_CONFIG" | base64 -d > $HOME/.kube/config
