module.exports = {
  branches: ['main', { name: 'beta', prerelease: true }],
  plugins: [
    '@semantic-release/commit-analyzer',
    [
      '@semantic-release/release-notes-generator',
      {
        writerOpts: {
          footerPartial: [
            '',
            '---',
            '',
            '## Install (Chrome / Chromium)',
            '',
            '### First time',
            '',
            '1. Download **wallet-extension-dist.zip** from the assets below',
            '2. Unzip to a permanent folder (e.g. `~/qubic-wallet`)',
            '3. Open `chrome://extensions`',
            '4. Enable **Developer mode** (top right)',
            '5. Click **Load unpacked** and select the unzipped folder',
            '6. Pin the extension from the puzzle icon in the toolbar',
            '',
            '### Updating',
            '',
            '1. Download the new **wallet-extension-dist.zip**',
            '2. Delete the contents of your existing extension folder',
            '3. Unzip the new files into the **same folder**',
            '4. Open `chrome://extensions` and click the **reload** button (↻) on the extension',
            '',
            '> **Important:** Always reuse the same folder. Loading from a different folder changes the extension ID and you will lose your wallet data.',
          ].join('\n'),
        },
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/github',
      {
        releaseNameTemplate: 'v<%= nextRelease.version %>',
        assets: [
          {
            path: 'dist.zip',
            label: 'wallet-extension-dist.zip',
          },
        ],
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
        message: 'chore(release): publish [skip ci]',
      },
    ],
  ],
}
