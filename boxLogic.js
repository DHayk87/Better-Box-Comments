let vscode;
try {
    vscode = require("vscode");
} catch {
    vscode = null;
}
const { generateBox } = require("./boxCore");

function getSettings() {
    const settings = vscode.workspace.getConfiguration("betterBoxComments");
    return {
        style: settings.get("borderStyle") || "Default",
        indentation:
            settings.get("indentation") !== undefined
                ? settings.get("indentation")
                : 2,
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

/**
 * Strips common leading comment tokens if ALL non-empty lines have them,
 * preventing nested comments inside newly created boxes.
 */
function stripCommentPrefixes(text) {
    const lines = text.split(/\r?\n/);
    const commentRegex = /^\s*(\/\/|#|--|\*)\s?/;
    const nonEmptyLines = lines.filter((l) => l.trim().length > 0);

    if (
        nonEmptyLines.length > 0 &&
        nonEmptyLines.every((l) => commentRegex.test(l))
    ) {
        return lines.map((l) => l.replace(commentRegex, "")).join("\n");
    }

    return text;
}

/**
 * Inserts an ASCII box around the selected text (or current line if empty).
 * @param {string|null} tag - Optional preset tag (e.g. "TODO", "ALERT")
 * @param {boolean} customPrompt - If true, prompts user for a custom tag name
 */
async function insertBox(tag = null, customPrompt = false) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    if (customPrompt) {
        const input = await vscode.window.showInputBox({
            prompt: "Enter custom tag (e.g., NOTE, FIXME, REVIEW, BUG)",
            placeHolder: "NOTE",
            validateInput: (value) => {
                if (value && value.trim().length > 15) {
                    return "Tag must be 15 characters or less";
                }
                return null;
            },
        });
        if (input === undefined) return; // User cancelled
        tag = input.trim().toUpperCase() || null;
    }

    const document = editor.document;
    const settings = getSettings();
    const eol = document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";

    let selection = editor.selection;

    // If no text selected, select the entire current line
    if (selection.isEmpty) {
        const line = document.lineAt(selection.start.line);
        selection = new vscode.Selection(
            line.lineNumber,
            0,
            line.lineNumber,
            line.text.length,
        );
    }

    const rawText = document.getText(selection);
    const textToBox = stripCommentPrefixes(rawText);
    const boxText = generateBox(textToBox, { ...settings, tag, eol });

    const startLine = selection.start.line;
    await editor.edit((editBuilder) => {
        editBuilder.replace(selection, boxText);
    });

    // Compute updated range of the inserted box
    const boxLineCount = boxText.split(/\r?\n/).length;
    const endLine = startLine + boxLineCount - 1;
    const endLineLength = document.lineAt(endLine).text.length;

    const newSelection = new vscode.Selection(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, endLineLength),
    );
    editor.selection = newSelection;

    // Apply VS Code commenting across the box lines
    await vscode.commands.executeCommand("editor.action.addCommentLine");

    // Position cursor cleanly on the line following the box
    const nextLine = endLine + 1;
    if (nextLine < document.lineCount) {
        const position = new vscode.Position(nextLine, 0);
        editor.selection = new vscode.Selection(position, position);
    }
}

module.exports = {
    insertBox,
    stripCommentPrefixes,
};
