import { debug, getState, setFailed } from '@actions/core'
import { setupKubeconfig } from 'login'
import { installKubectl } from 'setup'
import { teardown } from 'teardown'

if (getState('kubectl-path')) {
	debug('Running post kubectl-action setup')
	teardown()
		// eslint-disable-next-line unicorn/prefer-top-level-await
		.catch(error => {
			setFailed('Failed to install kubectl (this is a bug in kubectl-action): ')
			debug(JSON.stringify(error))
		})
} else {
	debug('Running kubectl-action setup')
	// eslint-disable-next-line no-async-promise-executor
	new Promise(async () => {
		await installKubectl()
		debug('kubectl-action setup complete')

		await setupKubeconfig()
		debug('kubectl-action kubeconfig setup complete')
	})
		// eslint-disable-next-line unicorn/prefer-top-level-await
		.catch(error => {
			setFailed('Failed to install kubectl (this is a bug in kubectl-action): ')
			debug(JSON.stringify(error))
		})
}
