# List deployments Github Action

This action returns a matrix that contains all deployments of a repository.

## Inputs

### `repository`

**Required** Repository for which to list the deployments.

### `Token`

**Required** Github token used to access the REST API to fetch the deployments.

## Outputs

### `deployments`

Matrix containing the following keys (with example data):
```json5
{
    "environment": "production",
    "deployment_id": 1234,
    "deployment_url": "/repos/pivvenit/list-queued-deployments-action/deployments/1234/statuses",
    "status": "queued",
    "ref": "deployment ref here",
    "deployment": {/* Raw deployment response from the Github Rest API */},
    "deployment_status": { /* The first status from the deployment_status response from the Github Rest API */}
}
```

## Example usage
```yaml
uses: dashcamio/list-deployments-action
with:
  token: "${{ github.token }}"
  repository: "${{ github.repository }}"
```
