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
            '1. Download **wallet-extension-dist.zip** from the assets below',
            '2. Unzip to a folder',
            '3. Open `chrome://extensions`',
            '4. Enable **Developer mode** (top right)',
            '5. Click **Load unpacked**',
            '6. Select the unzipped folder',
            '7. Pin the extension from the puzzle icon in the toolbar',
            '',
            '### Updating to a new version',
            '',
            '1. Download the new **wallet-extension-dist.zip**',
            '2. Unzip and **replace the files in the same folder** you loaded originally',
            '3. Go to `chrome://extensions` and click the reload button on the extension',
            '',
            '> **Important:** Do not remove and re-load from a different folder — this changes the extension ID and you will lose your accounts and settings.',
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
