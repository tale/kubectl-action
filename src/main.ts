/* eslint-disable unicorn/prefer-top-level-await */
import { debug, getState, setFailed } from '@actions/core'
import { installKubectl } from 'setup'

const post = Boolean(getState('isPost'))

if (!post) {
	debug('Running kubectl-action setup')
	installKubectl()
		.catch(error => {
			setFailed('Failed to install kubectl (this is a bug in kubectl-action): ')
			debug(JSON.stringify(error))
		})
}
