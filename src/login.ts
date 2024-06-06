import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { env } from 'node:process'

import { debug, getInput, saveState, setFailed } from '@actions/core'

export async function setupKubeconfig() {
	debug('Running kubectl-action setupKubeconfig()')

	if (env.HOME === undefined) {
		setFailed('$HOME is not defined')
		return
	}

	const config = getInput('base64-kube-config', {
		required: true,
		trimWhitespace: true
	})

	const decoded = Buffer.from(config, 'base64')
		.toString('utf8')

	const path = join(env.HOME, '.kube')
	saveState('kubeconfig-path', path)

	await mkdir(path, { recursive: true })
	await writeFile(join(path, 'config'), decoded, 'utf8')
}
