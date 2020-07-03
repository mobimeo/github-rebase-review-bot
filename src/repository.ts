import { DynamoDB } from 'aws-sdk';
import assert from 'assert';

const docClient = new DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const tableName = process.env['DYNAMODB_TABLE'];

async function get(key: string): Promise<string | undefined> {
  assert(tableName, 'DYNAMODB_TABLE unset');

  const params = {
    TableName: tableName,
    Key: { pull_request_url: key },
  };

  const data = await docClient.get(params).promise();
  return data.Item?.diff_hash;
}

async function set(key: string, value: string): Promise<void> {
  assert(tableName, 'DYNAMODB_TABLE unset');

  const params = {
    TableName: tableName,
    Item: {
      pull_request_url: key,
      diff_hash: value,
    },
  };

  await docClient.put(params).promise();
}

export { get, set };
