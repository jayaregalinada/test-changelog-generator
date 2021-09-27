const child = require('child_process');
const fs = require('fs');

// CONFIGURATIONS
const _configuration = {
    filePath: './CHANGELOG.md',
    withSubject: false,
    project: {
        commitUrl: 'https://github.com/jayaregalinada/test-changelog-generator/commit/'
    },
    prefixes: [
        { prefix: '- ADDED: ', itemKey: 'added', title: 'Added' },
        { prefix: '- CHANGED: ', itemKey: 'changed', title: 'Changed' },
        { prefix: '- FIXED: ', itemKey: 'fixed', title: 'Fixed' },
        { prefix: '- DEPRECATED: ', itemKey: 'deprecated', title: 'Deprecated' },
        { prefix: '- REMOVED: ', itemKey: 'removed', title: 'Removed' },
        { prefix: '- SECURITY: ', itemKey: 'security', title: 'Security' },
    ],
    markdown: {
        headerDate: '#',
        types: '##',
        item: '*'
    },
    shaLength: 6
}
let items = {
    added: [],
    changed: [],
    fixed: [],
    deprecated: [],
    removed: [],
    security: []
};
const delimiters = [
    '__',
    '----DELIMITER----',
];
const bodyFormat = _configuration.withSubject ? 'B' : 'b';
const output = child
    .execSync(`git log HEAD^..HEAD --format=%${bodyFormat}${delimiters[0]}%H${delimiters[1]}`)
    .toString('utf-8');

const commitsArray = output
    .split(`${delimiters[1]}\n`)
    .map((commit) => {
        let [message, sha] = commit.split(delimiters[0]);

        ['feature/', 'hotfix/'].forEach((commitPrefix) => {
            if (message.startsWith(commitPrefix)) {
                let headerMessage = message.split('\n');
                headerMessage.splice(0, 1);

                message = headerMessage.join('\n');
            }
        })

        return { sha, message };
    })
    .filter(commit => Boolean(commit.sha))
    .filter(commit => commit.message !== '')
    ;

const currentChangelog = fs.readFileSync(_configuration.filePath, 'utf-8');
const currentDate = new Date().toISOString().split('T')[0];
let newChangelog = `${_configuration.markdown.headerDate} ${currentDate}\n\n`;

itemGenerator = (commitMessage, replaceWord, commitSha) => {
    const { markdown, project, shaLength } = _configuration;

    return `${markdown.item} ${commitMessage.replace(replaceWord, '')} ([${commitSha.substr(0, shaLength)}](${project.commitUrl}${commitSha}))`;
}

commitsArray.forEach((commit) => {
    console.log('commitsArray', commit);
    _configuration.prefixes.forEach((prefixItem) => {
        const { message, sha } = commit;
        const { itemKey, prefix } = prefixItem;

        messages = message.split('\n');

        messages.forEach((messageBody) => {
            if (messageBody.startsWith(prefix)) {
                items[itemKey].push(itemGenerator(messageBody, prefix, sha));
            }
        });
    });
});

_configuration.prefixes.forEach((prefixItem) => {
    const { markdown } = _configuration;

    if (items[prefixItem.itemKey].length) {
        newChangelog += `${markdown.types} ${prefixItem.title}\n`;
        items[prefixItem.itemKey].forEach((item) => {
            newChangelog += item + '\n';
        });
        newChangelog += '\n';
    }
});

fs.writeFileSync(_configuration.filePath, `${newChangelog}${currentChangelog}`);
