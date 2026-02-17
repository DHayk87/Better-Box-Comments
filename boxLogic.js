const vscode = require("vscode");

const PRESETS = {
    Default: {
        tl: "┌",
        tm: "─",
        tr: "┐",
        l: "│",
        r: "│",
        bl: "└",
        bm: "─",
        br: "┘",
        dl: "├",
        dm: "─",
        dr: "┤",
    },
    Hash: {
        tl: "#",
        tm: "#",
        tr: "#",
        l: "#",
        r: "#",
        bl: "#",
        bm: "#",
        br: "#",
        dl: "#",
        dm: "#",
        dr: "#",
    },
    Equals: {
        tl: "=",
        tm: "=",
        tr: "=",
        l: "|",
        r: "|",
        bl: "=",
        bm: "=",
        br: "=",
        dl: "=",
        dm: "=",
        dr: "=",
    },
    Double: {
        tl: "╔",
        tm: "═",
        tr: "╗",
        l: "║",
        r: "║",
        bl: "╚",
        bm: "═",
        br: "╝",
        dl: "╠",
        dm: "═",
        dr: "╣",
    },
};

function getSettings() {
    const settings = vscode.workspace.getConfiguration("betterBoxComments");
    const style = settings.get("borderStyle") || "Default";
    const indentAmount = settings.get("indentation") || 2;
    const totalLength = settings.get("length") || 80;

    let chars = {};
    if (style !== "Custom" && PRESETS[style]) {
        chars = PRESETS[style];
    } else {
        chars = {
            tl: settings.get("chars.tl") || "┌",
            tm: settings.get("chars.tm") || "─",
            tr: settings.get("chars.tr") || "┐",
            l: settings.get("chars.l") || "│",
            r: settings.get("chars.r") || "│",
            bl: settings.get("chars.bl") || "└",
            bm: settings.get("chars.bm") || "─",
            br: settings.get("chars.br") || "┘",
            dl: settings.get("chars.dl") || "├",
            dm: settings.get("chars.dm") || "─",
            dr: settings.get("chars.dr") || "┤",
        };
    }

    return {
        CHAR_TL: chars.tl,
        CHAR_TM: chars.tm,
        CHAR_TR: chars.tr,
        CHAR_L: chars.l,
        CHAR_R: chars.r,
        CHAR_BL: chars.bl,
        CHAR_BM: chars.bm,
        CHAR_BR: chars.br,
        CHAR_DL: chars.dl,
        CHAR_DM: chars.dm,
        CHAR_DR: chars.dr,
        indent: " ".repeat(indentAmount),
        indentAmount: indentAmount,
        totalLength: totalLength,
    };
}

async function getCommentLength() {
    return 0;
}

function parseLines(selection, document, maxLineLength, settings) {
    let text = document.getText(selection).toString().replace(/\t/g, "  ");
    let linesOfText = text.split(/\r?\n/);
    let masterArray = [];

    const len = maxLineLength - 2 - settings.CHAR_L.length - settings.CHAR_R.length;

    for (let i = 0; i < linesOfText.length; i++) {
        let value = linesOfText[i];
        let lines = [];

        if (value.length >= len) {
            while (value.length) {
                let indexOf = value.substring(0, len).lastIndexOf(" ");
                if (indexOf === -1 || indexOf === 0) {
                    indexOf = len;
                }
                lines.push(value.substring(0, indexOf));
                value = value.substring(indexOf).trim();
            }
        } else {
            lines = [value];
        }
        masterArray = masterArray.concat(lines);
    }

    masterArray.forEach((line, index) => {
        if (line.trim() === "--") {
            masterArray[index] = settings.CHAR_DM.repeat(maxLineLength - 4);
        } else {
            const padding = Math.max(0, maxLineLength - line.length - 4);
            masterArray[index] = line + " ".repeat(padding);
        }
    });

    return masterArray;
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

    let lineLength = settings.totalLength - settings.indentAmount;
    const lines = parseLines(selection, document, lineLength, settings);

    let replacementText = lines
        .map((line) => {
            if (line.startsWith(settings.CHAR_DM)) {
                return settings.indent + settings.CHAR_DL + line + settings.CHAR_DR;
            }
            return settings.indent + settings.CHAR_L + " " + line + " " + settings.CHAR_R;
        })
        .join("\n");

    let topBorder = settings.CHAR_TM.repeat(lineLength - 2);
    if (tag) {
        const tagStr = ` [${tag}] `;
        if (topBorder.length > tagStr.length + 4) {
            topBorder =
                settings.CHAR_TM.repeat(2) +
                tagStr +
                settings.CHAR_TM.repeat(topBorder.length - tagStr.length - 2);
        }
    }

    const boxText = [
        settings.indent + settings.CHAR_TL + topBorder + settings.CHAR_TR,
        replacementText,
        settings.indent +
            settings.CHAR_BL +
            settings.CHAR_BM.repeat(lineLength - 2) +
            settings.CHAR_BR,
    ].join("\n");

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
