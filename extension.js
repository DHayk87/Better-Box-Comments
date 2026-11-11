let vscode;
try {
    vscode = require("vscode");
} catch {
    vscode = null;
}
const { insertBox } = require("./boxLogic");
const { PRESETS } = require("./boxCore");

let decorations = {};
let cachedSymbols = null;
let updateTimeout = null;

function getCachedBorderSymbols() {
    if (cachedSymbols) return cachedSymbols;

    const settings = vscode.workspace.getConfiguration("betterBoxComments");

    const startSymbols = Object.values(PRESETS).map((p) => p.tl);
    const endSymbols = Object.values(PRESETS).map((p) => p.tr);
    const bottomStartSymbols = Object.values(PRESETS).map((p) => p.bl);
    const bottomEndSymbols = Object.values(PRESETS).map((p) => p.br);

    const borderChars = new Set();
    Object.values(PRESETS).forEach((p) => {
        Object.values(p).forEach((char) => borderChars.add(char));
    });

    const customTl = settings.get("chars.tl");
    if (customTl) {
        startSymbols.push(customTl);
        borderChars.add(customTl);
    }
    const customTr = settings.get("chars.tr");
    if (customTr) {
        endSymbols.push(customTr);
        borderChars.add(customTr);
    }
    const customBl = settings.get("chars.bl");
    if (customBl) {
        bottomStartSymbols.push(customBl);
        borderChars.add(customBl);
    }
    const customBr = settings.get("chars.br");
    if (customBr) {
        bottomEndSymbols.push(customBr);
        borderChars.add(customBr);
    }

    cachedSymbols = {
        startSymbols,
        endSymbols,
        bottomStartSymbols,
        bottomEndSymbols,
        borderChars,
    };

    return cachedSymbols;
}

function clearSymbolCache() {
    cachedSymbols = null;
}

function isCommentLine(line) {
    const trimmed = line.trim();
    return (
        trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("--") ||
        trimmed.startsWith("<!--") ||
        trimmed.startsWith(";") ||
        trimmed.startsWith("%")
    );
}

function isBorderLine(line, borderChars) {
    const trimmed = line.trim();
    let count = 0;
    for (const c of trimmed) {
        if (borderChars.has(c)) count++;
    }
    return count >= 8;
}

function updateDecorations(editor) {
    if (!editor || !decorations) return;

    const symbols = getCachedBorderSymbols();
    const settings = vscode.workspace.getConfiguration("betterBoxComments");
    const maxBoxLines = settings.get("maxBoxLines") || 200;

    const text = editor.document.getText();
    const lines = text.split(/\r?\n/);

    const decorationRanges = {
        TODO: [],
        ALERT: [],
        INFO: [],
        WARNING: [],
        STANDARD: [],
    };

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!isCommentLine(trimmed) && !isBorderLine(trimmed, symbols.borderChars)) {
            i++;
            continue;
        }

        const tagMatch = trimmed.match(
            /\[(TODO|ALERT|INFO|WARNING|[A-Z0-9_-]{2,15})\]/i,
        );
        const hasBorderChars = isBorderLine(trimmed, symbols.borderChars);
        const isStart =
            hasBorderChars &&
            symbols.startSymbols.some((s) => trimmed.includes(s)) &&
            symbols.endSymbols.some((s) => trimmed.includes(s));

        if (tagMatch || isStart) {
            const matchedTag = tagMatch ? tagMatch[1].toUpperCase() : null;
            const tag =
                matchedTag && decorationRanges[matchedTag]
                    ? matchedTag
                    : matchedTag
                      ? "INFO"
                      : "STANDARD";
            const startLine = i;

            let bestBottomLine = -1;
            let j = i + 1;

            while (j < lines.length && j - startLine <= maxBoxLines) {
                const innerTrimmed = lines[j].trim();
                const hasSideBorders =
                    innerTrimmed.includes("│") ||
                    innerTrimmed.includes("║") ||
                    innerTrimmed.includes("|") ||
                    innerTrimmed.includes("#");

                if (!isCommentLine(innerTrimmed) && !hasSideBorders) {
                    break;
                }

                const isBottom =
                    isBorderLine(innerTrimmed, symbols.borderChars) &&
                    symbols.bottomStartSymbols.some((s) =>
                        innerTrimmed.includes(s),
                    ) &&
                    symbols.bottomEndSymbols.some((s) =>
                        innerTrimmed.includes(s),
                    );

                if (isBottom) {
                    bestBottomLine = j;
                    // Check if following line continues box (e.g. if this was a divider)
                    const nextLine =
                        j + 1 < lines.length ? lines[j + 1].trim() : "";
                    const nextIsContent =
                        (isCommentLine(nextLine) ||
                            isBorderLine(nextLine, symbols.borderChars)) &&
                        (nextLine.includes("│") ||
                            nextLine.includes("║") ||
                            nextLine.includes("|") ||
                            nextLine.includes("#"));
                    if (!nextIsContent) {
                        break;
                    }
                }
                j++;
            }

            if (bestBottomLine > startLine + 1) {
                const range = new vscode.Range(
                    new vscode.Position(startLine, 0),
                    new vscode.Position(bestBottomLine, lines[bestBottomLine].length),
                );
                decorationRanges[tag].push(range);
                i = bestBottomLine + 1;
                continue;
            }
        }
        i++;
    }

    for (const tag in decorations) {
        editor.setDecorations(decorations[tag], decorationRanges[tag] || []);
    }
}

function triggerUpdateDecorations(editor, delayMs = 120) {
    if (!editor) return;
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
        updateDecorations(editor);
    }, delayMs);
}

function createDecorations() {
    if (decorations) {
        for (const key in decorations) {
            decorations[key].dispose();
        }
    }

    const settings = vscode.workspace.getConfiguration("betterBoxComments");
    const colors = {
        TODO: settings.get("colors.todo") || "#3498db",
        ALERT: settings.get("colors.alert") || "#e74c3c",
        INFO: settings.get("colors.info") || "#2ecc71",
        WARNING: settings.get("colors.warning") || "#f39c12",
        STANDARD: settings.get("colors.standard") || "#dcdde1",
    };

    decorations = {
        TODO: vscode.window.createTextEditorDecorationType({
            color: colors.TODO,
            fontWeight: "bold",
            isWholeLine: false,
        }),
        ALERT: vscode.window.createTextEditorDecorationType({
            color: colors.ALERT,
            fontWeight: "bold",
            isWholeLine: false,
        }),
        INFO: vscode.window.createTextEditorDecorationType({
            color: colors.INFO,
            fontWeight: "bold",
            isWholeLine: false,
        }),
        WARNING: vscode.window.createTextEditorDecorationType({
            color: colors.WARNING,
            fontWeight: "bold",
            isWholeLine: false,
        }),
        STANDARD: vscode.window.createTextEditorDecorationType({
            color: colors.STANDARD,
            isWholeLine: false,
        }),
    };
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    createDecorations();

    // Command registrations
    context.subscriptions.push(
        vscode.commands.registerCommand("better-box-comments.createBox", () => {
            insertBox().then(() =>
                updateDecorations(vscode.window.activeTextEditor),
            );
        }),
        vscode.commands.registerCommand("better-box-comments.createTodoBox", () => {
            insertBox("TODO").then(() =>
                updateDecorations(vscode.window.activeTextEditor),
            );
        }),
        vscode.commands.registerCommand("better-box-comments.createAlertBox", () => {
            insertBox("ALERT").then(() =>
                updateDecorations(vscode.window.activeTextEditor),
            );
        }),
        vscode.commands.registerCommand("better-box-comments.createInfoBox", () => {
            insertBox("INFO").then(() =>
                updateDecorations(vscode.window.activeTextEditor),
            );
        }),
        vscode.commands.registerCommand(
            "better-box-comments.createWarningBox",
            () => {
                insertBox("WARNING").then(() =>
                    updateDecorations(vscode.window.activeTextEditor),
                );
            },
        ),
        vscode.commands.registerCommand(
            "better-box-comments.createCustomTagBox",
            () => {
                insertBox(null, true).then(() =>
                    updateDecorations(vscode.window.activeTextEditor),
                );
            },
        ),
    );

    // Event listeners
    vscode.window.onDidChangeActiveTextEditor(
        (editor) => {
            if (editor) {
                updateDecorations(editor);
            }
        },
        null,
        context.subscriptions,
    );

    vscode.workspace.onDidOpenTextDocument(
        (doc) => {
            const editor = vscode.window.visibleTextEditors.find(
                (e) => e.document === doc,
            );
            if (editor) {
                updateDecorations(editor);
            }
        },
        null,
        context.subscriptions,
    );

    vscode.workspace.onDidChangeTextDocument(
        (event) => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document) {
                triggerUpdateDecorations(editor, 120);
            }
        },
        null,
        context.subscriptions,
    );

    vscode.workspace.onDidChangeConfiguration(
        (event) => {
            if (event.affectsConfiguration("betterBoxComments.colors")) {
                createDecorations();
            }
            if (
                event.affectsConfiguration("betterBoxComments.borderStyle") ||
                event.affectsConfiguration("betterBoxComments.chars") ||
                event.affectsConfiguration("betterBoxComments.maxBoxLines")
            ) {
                clearSymbolCache();
            }
            vscode.window.visibleTextEditors.forEach((editor) => {
                updateDecorations(editor);
            });
        },
        null,
        context.subscriptions,
    );

    vscode.window.visibleTextEditors.forEach((editor) => {
        updateDecorations(editor);
    });
}

function deactivate() {
    if (updateTimeout) clearTimeout(updateTimeout);
}

module.exports = {
    activate,
    deactivate,
};
