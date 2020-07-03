# GitHub Rebase Review Bot

A GitHub App built with [Probot](https://github.com/probot/probot) to undo automatic PR review dismissals, given the diff did not change since the last approval. The hashes are stored in AWS DynamoDB.

## Test

```
npm i
npm t
```

## Development

A `DYNAMODB_TABLE` value needs to be set in the env (or put into the `.env` file).

```sh
# Install dependencies
npm install

# Run with hot reload
npm run dev

# Compile and run
npm run build
npm run start
```

## Create App

### Start Server

```
npm run dev
```

### Register at GitHub

Open `http://localhost:3000/probot` and follow instructions to install it to some repository or organisation.

## Deploy

### Package Lambda Bundle

```
npm run package
```

### Template and Deploy SAM Stack

You need to set the `AppId` as Stack Param, it should be generated and stored in the local `.env` file.

```
aws cloudformation package \
  --template-file deploy/app.yaml \
  --s3-bucket cf-templates-106qhq40bhwiu-eu-west-1 \
  --output-template-file output.yaml
cfn-go cu output.yaml deploy/github-rebase-review-bot.legacy.json
```

### Secrets

`WEBHOOK_SECRET` and `PRIVATE_KEY` can be retrieved from the local `.env` file. They need to be stored in the AWS SecretManager objects that have been created in the Stack. `PRIVATE_KEY` should be a pem file and encoded as base64:

```
echo "$PRIVATE_KEY"
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
export SECRET=$(echo "$PRIVATE_KEY" | base64)
```

### Webhook Url

After the Stack's deployment the ApiGateway's Url (sth like `https://swmwkyi6rf.execute-api.eu-west-1.amazonaws.com`) needs to be configured as `Webhook URL` in the "General" pane of the GitHub App.

## Debug

You can inspect the lambda logs or the activity log in the GitHub App's "Advanced" tab.

## Contributing

If you have suggestions for how github-rebase-review-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2020 Magnus Kulke <magnus.kulke@reach-now.com>
