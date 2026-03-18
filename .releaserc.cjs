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
            '> **Note:** This is a pre-release build. To update, download the latest zip, remove the old extension, and load the new folder.',
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
