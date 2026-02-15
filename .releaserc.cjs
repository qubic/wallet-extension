module.exports = {
  branches: ['main', { name: 'dev', prerelease: 'dev' }],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
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
        releaseNameTemplate:
          "<%= branch.name === 'main' ? 'release-' + new Date().toISOString().slice(0, 10) : 'dev-release-' + new Date().toISOString().slice(0, 10) %>",
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
