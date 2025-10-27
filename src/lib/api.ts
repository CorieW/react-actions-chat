interface GitHubNotification {
  readonly id: string;
  readonly type: 'pull_request' | 'issue' | 'commit' | 'star';
  readonly title: string;
  readonly repository: string;
  readonly author: string;
  readonly authorAvatar: string;
  readonly time: string;
  readonly url: string;
}

// Mock data for demonstration
const MOCK_NOTIFICATIONS: readonly GitHubNotification[] = [
  {
    id: '1',
    type: 'pull_request',
    title: 'Add dark mode support',
    repository: 'my-org/awesome-project',
    author: 'john-doe',
    authorAvatar: 'https://github.com/john-doe.png',
    time: '2 hours ago',
    url: 'https://github.com/my-org/awesome-project/pull/123'
  },
  {
    id: '2',
    type: 'issue',
    title: 'Bug: Login form not working on mobile',
    repository: 'my-org/awesome-project',
    author: 'jane-smith',
    authorAvatar: 'https://github.com/jane-smith.png',
    time: '4 hours ago',
    url: 'https://github.com/my-org/awesome-project/issues/456'
  },
  {
    id: '3',
    type: 'commit',
    title: 'Fix responsive layout issues',
    repository: 'my-org/web-app',
    author: 'bob-wilson',
    authorAvatar: 'https://github.com/bob-wilson.png',
    time: '1 day ago',
    url: 'https://github.com/my-org/web-app/commit/abc123'
  },
  {
    id: '4',
    type: 'star',
    title: 'Your repository was starred',
    repository: 'my-org/mobile-app',
    author: 'alice-brown',
    authorAvatar: 'https://github.com/alice-brown.png',
    time: '2 days ago',
    url: 'https://github.com/my-org/mobile-app'
  },
  {
    id: '5',
    type: 'pull_request',
    title: 'Update dependencies to latest versions',
    repository: 'my-org/web-app',
    author: 'dev-user',
    authorAvatar: 'https://github.com/dev-user.png',
    time: '3 hours ago',
    url: 'https://github.com/my-org/web-app/pull/789'
  },
  {
    id: '6',
    type: 'issue',
    title: 'Feature request: Add export functionality',
    repository: 'my-org/mobile-app',
    author: 'feature-fan',
    authorAvatar: 'https://github.com/feature-fan.png',
    time: '5 hours ago',
    url: 'https://github.com/my-org/mobile-app/issues/234'
  },
  {
    id: '7',
    type: 'commit',
    title: 'Refactor authentication module',
    repository: 'my-org/api-server',
    author: 'backend-dev',
    authorAvatar: 'https://github.com/backend-dev.png',
    time: '6 hours ago',
    url: 'https://github.com/my-org/api-server/commit/def456'
  }
] as const;

/**
 * Fetches GitHub notifications
 * 
 * @returns Array of notification objects
 * @throws {Error} If the fetch fails
 */
export async function fetchGitHubNotifications(): Promise<readonly GitHubNotification[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, this would be an API call like:
  // const response = await fetch('https://api.github.com/notifications', {
  //   headers: {
  //     'Authorization': `token ${YOUR_GITHUB_TOKEN}`,
  //     'Accept': 'application/vnd.github.v3+json'
  //   }
  // })
  // 
  // if (!response.ok) {
  //   throw new Error('Failed to fetch GitHub notifications')
  // }
  // 
  // return await response.json()
  
  return MOCK_NOTIFICATIONS;
}

