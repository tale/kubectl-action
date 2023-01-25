import { rm } from 'node:fs/promises'

import { debug, getState } from '@actions/core'

export async function teardown() {
	debug('Running kubectl-action teardown()')
	console.log('Removing kubectl and kubeconfig')

	const path = getState('kubectl-path')
	await rm(path, { recursive: true, force: true })

	const configPath = getState('kubeconfig-path')
	await rm(configPath, { recursive: true, force: true })
}
