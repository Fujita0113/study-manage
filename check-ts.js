const ts = require('typescript');
const fs = require('fs');

const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
const { options, fileNames } = ts.parseJsonConfigFileContent(config, ts.sys, './');

const program = ts.createProgram(fileNames, options);
const allDiagnostics = ts.getPreEmitDiagnostics(program);

const errors = allDiagnostics.map(diagnostic => {
    if (diagnostic.file) {
        const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        return `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`;
    } else {
        return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    }
});
fs.writeFileSync('ts-errs.txt', errors.join('\n'));
