const core = require("@actions/core");
const axios = require("axios");
const https = require("https");

console.log("running ...");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
process.on("unhandledRejection", handleError);
main().catch(handleError);

async function main() {
  const rancherUrl = core.getInput("rancher_url", { required: true });
  const rancherToken = core.getInput("rancher_token", { required: true });
  const clusterId = core.getInput("cluster_id", { required: true });
  const projectId = core.getInput("project_id", { required: true });
  const namespace = core.getInput("namespace", { required: true });
  const deployment = core.getInput("deployment", { required: true });
  const dockerImage = core.getInput("docker_image", { required: true });

  await axios.patch(
    `${rancherUrl}/k8s/clusters/${clusterId}/apis/apps/v1/namespaces/${namespace}/deployments/${deployment}`,
    [
      {
        op: "replace",
        path: "/spec/template/spec/containers/0/image",
        value: dockerImage,
      },
    ],
    {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        "Content-Type": "application/json-patch+json",
        Authorization: "Bearer " + rancherToken,
      },
    }
  );

  await axios.post(
    `${rancherUrl}/v3/projects/${clusterId}:${projectId}/workloads/deployment:${namespace}:${deployment}?action=redeploy`,
    {},
    {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + rancherToken,
      },
    }
  );
}

function handleError(err) {
  console.log(err);
  core.setFailed(err.message);
}
