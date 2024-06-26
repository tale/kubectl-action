# kubectl-action

GitHub Action to manage a K8s (Kubernetes) cluster using kubectl.

## Usage

To use this action, add the following step to your GitHub Action workflow:

```yaml
- uses: tale/kubectl-action@v1
  with:
    base64-kube-config: ${{ secrets.KUBE_CONFIG }}
```

Keep in mind that the action expects a base64 encoded string of your Kubernetes configuration. The simplest way to do that is to run `cat $HOME/.kube/config | base64` and save that output as an action secret. It's additionally possible to generate a config file using the `aws` CLI for EKS or any other tools with other cloud providers.

It's also possible to specify the version of the [kubectl](https://kubernetes.io/docs/reference/kubectl/) CLI to use. The current default release used by this action is the latest version.

```yaml
- uses: tale/kubectl-action@v1
  with:
    base64-kube-config: ${{ secrets.KUBE_CONFIG }}
    kubectl-version: v1.22.0
```

Once you've completed this setup, you have direct access to the `kubectl` binary and command in the rest of your actions. Here's a full example to give you some inspiration:

```yaml
name: Kubectl Action

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: tale/kubectl-action@v1
      with:
        base64-kube-config: ${{ secrets.KUBE_CONFIG }}
    - run: kubectl get pods
```

Here's an example using AWS EKS:

```yaml
name: Kubectl Action

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::123456789100:role/my-github-actions-role
        aws-region: us-east-2
    - name: Generate kubeconfig
      run: |
        {
            echo 'EKS_CREDS<<EOF'
            aws eks update-kubeconfig --region us-east-2 --name my-cluster --dry-run | base64
            echo EOF
        } >> $GITHUB_ENV
    - uses: tale/kubectl-action@v1
      with:
        base64-kube-config: ${{ env.EKS_CREDS }}
    - run: kubectl get pods
```
