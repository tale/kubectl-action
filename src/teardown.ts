import { rm } from 'node:fs/promises'

import { debug, getState } from '@actions/core'

export async function teardown() {
	debug('Running kubectl-action teardown()')
	console.log('Removing kubeconfig')

	const configPath = getState('kubeconfig-path')
	await rm(configPath, { recursive: true, force: true })
}
