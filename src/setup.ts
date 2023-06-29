import { chmod } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { env } from 'node:process'

import { addPath, debug, getInput, setFailed } from '@actions/core'
import { cacheFile, downloadTool, find } from '@actions/tool-cache'
import { fetch } from 'undici'

export async function installKubectl() {
	debug('Running kubectl-action installKubectl()')

	if (env.RUNNER_TEMP === undefined) {
		setFailed('$RUNNER_TEMP is not defined')
		return
	}

	const input = getInput('kubectl-version', {
		required: false,
		trimWhitespace: true
	})

	const version = input === 'latest' || input === '' ? await fetchLatestVersion() : input
	debug(`kubectl-version: ${version ?? 'undefined'}`)

	if (!version?.startsWith('v')) {
		setFailed('Unable to determine the `kubectl` version to install')
		return
	}

	console.log(`Installing kubectl version ${version}`)

	try {
		const path = await fetchKubectl(version)
		await chmod(path, '775')
		addPath(dirname(path))
		debug(`kubectl ${version} installed and cached at ${path}`)
	} catch {
		debug('Failed to download kubectl from dl.k8s.io')
		setFailed('Failed to download kubectl from dl.k8s.io\nPlease check the version you specified is valid')
	}
}

// Fetches the latest kubectl version from the Kubernetes release server
async function fetchLatestVersion() {
	const response = await fetch('https://dl.k8s.io/release/stable.txt')
	if (!response.ok) {
		setFailed(`Failed to fetch latest kubectl version with status ${response.status}`)
		return
	}

	const version = await response.text()
	return version.trim()
}

// Downloads the kubectl binary from the Kubernetes release server
// If already downloaded, returns the path to the cached binary
async function fetchKubectl(version: string) {
	const cachedPath = find('kubectl', version)

	// Cached path is a directory containing the kubectl binary
	if (cachedPath) {
		debug(`kubectl ${version} already installed`)
		return join(cachedPath, 'kubectl')
	}

	// TODO: Support other platforms
	const url = `https://dl.k8s.io/release/${version}/bin/linux/amd64/kubectl`

	console.log(`Downloading kubectl (${url})`)
	const downloadPath = await downloadTool(url)
	const toolPath = await cacheFile(downloadPath, 'kubectl', 'kubectl', version)
	return join(toolPath, 'kubectl')
}
