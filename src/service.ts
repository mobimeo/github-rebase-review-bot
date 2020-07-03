import { Context } from 'probot';
import { WebhookPayloadPullRequestReview } from '@octokit/webhooks';
import { createHash } from 'crypto';
import { set, get } from './repository';

type PRContext = Context<WebhookPayloadPullRequestReview>;
async function getHash(context: PRContext): Promise<string> {
  const response = await context.github.pulls.get(
    context.issue({
      headers: { Accept: 'application/vnd.github.diff' },
    }),
  );
  const diff = response.data as unknown;
  if (typeof diff !== 'string') {
    throw new Error('diff is not a string');
  }
  return createHash('sha256').update(diff).digest('hex');
}

async function addReview(context: PRContext): Promise<void> {
  const message = context.issue({
    body: 'Dismissal dismissed, diff did not change!',
    event: 'APPROVE' as const,
  });
  const response = await context.github.pulls.createReview(message);
  if (response.data.state !== 'APPROVED') {
    throw new Error('pull request could not be approved');
  }
}

export async function handleAction(context: PRContext): Promise<void> {
  const { payload } = context;
  const { action, review } = payload;

  const key = review.pull_request_url;
  const hash = await getHash(context);

  if (action == 'submitted' && review.state == 'approved') {
    await set(key, hash);
  } else if (action == 'dismissed') {
    const approvedHash = await get(key);
    if (approvedHash === hash) {
      await addReview(context);
    }
  }
}
