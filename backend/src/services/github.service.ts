import { Octokit } from "@octokit/rest";
import { env } from "../config/env.js";

const octokit = new Octokit({ auth: env.githubToken });

export async function getRepo(owner: string, repo: string) {
  const { data } = await octokit.repos.get({ owner, repo });
  return data;
}

export async function getPullRequest(owner: string, repo: string, pullNumber: number) {
  const { data } = await octokit.pulls.get({ owner, repo, pull_number: pullNumber });
  return data;
}

/**
 * Returns whether a PR can be merged. `mergeable_state` is the interesting
 * part: "clean" = safe to merge, "dirty" = has conflicts, "blocked" =
 * blocked by branch protection rules, etc.
 */
export async function checkMergeability(owner: string, repo: string, pullNumber: number) {
  const pr = await getPullRequest(owner, repo, pullNumber);
  return {
    mergeable: pr.mergeable,
    mergeableState: pr.mergeable_state,
  };
}

export async function getPullRequestDiff(owner: string, repo: string, pullNumber: number) {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    mediaType: { format: "diff" },
  });
  return data as unknown as string;
}
