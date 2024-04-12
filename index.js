const core = require('@actions/core');
const github = require('@actions/github');

const options = {
  token: core.getInput('github-token'),
  environment: core.getInput('environment'),
  timeout: core.getInput('timeout'),
  interval: core.getInput('interval')
};

console.log(`Interval input: ${options.interval}`);  // Debug the interval input

waitForDeployment(options)
  .then(res => {
    core.setOutput('id', res.deployment.id);
    core.setOutput('url', res.url);
  })
  .catch(error => {
    core.setFailed(error.message);
  });

async function waitForDeployment(options) {
  const { token, interval, environment } = options;
  const timeout = parseInt(options.timeout, 10) || 30;

  const { sha } = github.context;
  const octokit = github.getOctokit(token);
  const start = Date.now();

  const params = {
    ...github.context.repo,
    environment,
    sha
  };

  core.info(`Deployment params: ${JSON.stringify(params, null, 2)}`);

  while (true) {
    const { data: deployments } = await octokit.repos.listDeployments(params);
    core.info(`Found ${deployments.length} deployments...`);

    for (const deployment of deployments) {
      core.info(`\tgetting statuses for deployment ${deployment.id}...`);

      const { data: statuses } = await octokit.request('GET /repos/:owner/:repo/deployments/:deployment/statuses', {
        ...github.context.repo,
        deployment: deployment.id
      });

      core.info(`\tfound ${statuses.length} statuses`);

      const successStatus = statuses.find(status => status.state === 'success');
      if (successStatus) {
        core.info(`\tsuccess! ${JSON.stringify(successStatus, null, 2)}`);
        let url = successStatus.target_url;
        if (deployment.payload && deployment.payload.web_url) {
          url = deployment.payload.web_url;
        }
        return {
          deployment,
          status: successStatus,
          url
        };
      } else {
        core.info(`No statuses with state === "success": "${statuses.map(status => status.state).join('", "')}"`);
      }

      await sleep(interval); // Debug if this is correctly pausing
    }

    const elapsed = (Date.now() - start) / 1000;
    if (elapsed >= timeout) {
      throw new Error(`Timing out after ${timeout} seconds (${elapsed} seconds elapsed)`);
    }

    await sleep(interval); // Debug if this is correctly pausing

  }
}

function sleep(seconds) {
  const ms = parseInt(seconds, 10) * 1000;
  if (isNaN(ms) || ms <= 0) {
    console.error('Invalid interval. Using default 1000ms.');
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
  return new Promise(resolve => setTimeout(resolve, ms));
}
