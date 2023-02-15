import { createHash, randomUUID } from 'node:crypto'
import { chmod, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { env, stdout } from 'node:process'
import { clearLine, cursorTo } from 'node:readline'

import { addPath, debug, getInput, saveState, setFailed, warning } from '@actions/core'
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
	const kubectl = await downloadKubectl(version)

	if (!kubectl) {
		return
	}

	const path = join(env.RUNNER_TEMP, randomUUID())
	await mkdir(path, { recursive: true })
	saveState('kubectl-path', path)

	console.log(`Installing kubectl to ${path}`)
	await writeFile(join(path, 'kubectl'), kubectl)
	await chmod(join(path, 'kubectl'), '755')
	addPath(path)
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
// Also runs a checksum verification on the downloaded binary
async function downloadKubectl(version: string) {
	const url = `https://dl.k8s.io/release/${version}/bin/linux/amd64/kubectl`
	const hashUrl = `${url}.sha256`

	console.log(`Downloading kubectl (${url})`)
	debug(`Downloading kubectl checksum (${hashUrl})`)

	const hashResponse = await fetch(hashUrl)
	if (!hashResponse.ok) {
		debug(`Failed to download kubectl checksum with status ${hashResponse.status}`)
		warning(`Skipping checksum verification for kubectl ${version}`)
	}

	const hash = hashResponse.ok ? await hashResponse.text() : ''

	const response = await fetch(url)
	if (!response.ok || !response.body) {
		debug(`Failed to download kubectl with status ${response.status}`)
		setFailed(`Failed to download kubectl with status ${response.status}`)
		return
	}

	const hashStream = createHash('sha256')
	const { body, headers } = response
	const size = Number(headers.get('content-length'))
	debug(`Downloaded kubectl (${size} bytes)`)

	let downloaded = 0
	let progressed = 0
	const buffer = Buffer.alloc(size)

	for await (const chunk of body as AsyncIterable<Buffer>) {
		buffer.write(chunk.toString('binary'), downloaded, 'binary')
		hashStream.update(chunk)
		downloaded += chunk.length

		if (Math.floor((downloaded / size) * 80) > progressed) {
			clearLine(stdout, 0)
			cursorTo(stdout, 0)

			progressed++
			stdout.write(`[${'='.repeat(progressed)}>${' '.repeat(80 - progressed)}]`)
		}
	}

	clearLine(stdout, 0)
	cursorTo(stdout, 0)
	console.log(`[${'='.repeat(80)}]`)

	const hashSum = hashStream.digest('hex')
	if (hashResponse.ok && hashSum !== hash) {
		debug(`Checksum verification failed for kubectl ${version}`)
		setFailed(`Checksum verification failed for kubectl ${version}`)
		return
	}

	return buffer
}
