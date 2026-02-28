const vscode = require("vscode");
const { generateBox } = require("./boxCore");

function getSettings() {
    const settings = vscode.workspace.getConfiguration("betterBoxComments");
    return {
        style: settings.get("borderStyle") || "Default",
        indentation:
            settings.get("indentation") !== undefined ? settings.get("indentation") : 2,
        length: settings.get("length") || 80,
        tl: settings.get("chars.tl"),
        tm: settings.get("chars.tm"),
        tr: settings.get("chars.tr"),
        l: settings.get("chars.l"),
        r: settings.get("chars.r"),
        bl: settings.get("chars.bl"),
        bm: settings.get("chars.bm"),
        br: settings.get("chars.br"),
        dl: settings.get("chars.dl"),
        dm: settings.get("chars.dm"),
        dr: settings.get("chars.dr"),
    };
}

async function insertBox(tag = null) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    let selection = editor.selection;
    const settings = getSettings();

    // Use current line if empty
    if (selection.isEmpty) {
        const line = document.lineAt(selection.start.line);
        selection = new vscode.Selection(
            line.lineNumber,
            0,
            line.lineNumber,
            line.text.length,
        );
    }

    const text = document.getText(selection);
    const boxText = generateBox(text, { ...settings, tag });

    const startLine = selection.start.line;
    await editor.edit((editBuilder) => {
        editBuilder.replace(selection, boxText);
    });

    // Box range calculation
    const endLine = startLine + boxText.split("\n").length - 1;
    const newSelection = new vscode.Selection(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).text.length),
    );
    editor.selection = newSelection;

    // Apply VS Code commenting
    await vscode.commands.executeCommand("editor.action.addCommentLine");

    // Cursor positioning
    const nextLine = endLine + 1;
    if (nextLine < document.lineCount) {
        const position = new vscode.Position(nextLine, 0);
        editor.selection = new vscode.Selection(position, position);
    }
}

module.exports = {
    insertBox,
};
