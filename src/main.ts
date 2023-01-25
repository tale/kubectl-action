/* eslint-disable unicorn/prefer-top-level-await */
import { debug, getState, setFailed } from '@actions/core'
import { setupKubeconfig } from 'login'
import { installKubectl } from 'setup'

const post = Boolean(getState('isPost'))

if (!post) {
	debug('Running kubectl-action setup')
	new Promise(async () => {
		await installKubectl()
		debug('kubectl-action setup complete')

		await setupKubeconfig()
		debug('kubectl-action kubeconfig setup complete')
	})
		.catch(error => {
			setFailed('Failed to install kubectl (this is a bug in kubectl-action): ')
			debug(JSON.stringify(error))
		})
}
