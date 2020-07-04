import { serverless } from '@probot/serverless-lambda';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { SecretsManager } from 'aws-sdk';
import assert from 'assert';
import appFn from '.';

const serverlessApp = serverless(appFn);
const client = new SecretsManager();

async function populateEnvSecrets(): Promise<void> {
  const pkName = process.env['PRIVATE_KEY_SECRET_NAME'];
  assert(pkName, 'PRIVATE_KEY_SECRET_NAME env not set');
  const pkSecret = await client.getSecretValue({ SecretId: pkName }).promise();
  process.env['PRIVATE_KEY'] = pkSecret.SecretString;

  const wsName = process.env['WEBHOOK_SECRET_SECRET_NAME'];
  assert(wsName, 'WEBHOOK_SECRET_SECRET_NAME env not set');
  const wsSecret = await client.getSecretValue({ SecretId: wsName }).promise();
  process.env['WEBHOOK_SECRET'] = wsSecret.SecretString;
}

const handler: APIGatewayProxyHandler = (event, context, callback) => {
  populateEnvSecrets()
    .then(() => serverlessApp(event, context, callback))
    .catch(err => callback(err));
};

exports.probot = handler;
