const { insertBox } = require("./boxLogic");
const { PRESETS } = require("./boxCore");

let decorations = {};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log("Better Box Comments is now active!");

    createDecorations();

    // Decoration refresh logic
    function updateDecorations(editor) {
        if (!editor || !decorations) return;

        const settings = vscode.workspace.getConfiguration("betterBoxComments");

        // Border symbol definitions from shared core
        const startSymbols = Object.values(PRESETS).map((p) => p.tl);
        const endSymbols = Object.values(PRESETS).map((p) => p.tr);
        const bottomStartSymbols = Object.values(PRESETS).map((p) => p.bl);
        const bottomEndSymbols = Object.values(PRESETS).map((p) => p.br);

        // Collect all border characters for detection
        const borderChars = [];
        Object.values(PRESETS).forEach((p) => {
            Object.values(p).forEach((char) => {
                if (!borderChars.includes(char)) borderChars.push(char);
            });
        });

        // Custom symbol support
        const customTl = settings.get("chars.tl");
        if (customTl) startSymbols.push(customTl);
        const customTr = settings.get("chars.tr");
        if (customTr) endSymbols.push(customTr);
        const customBl = settings.get("chars.bl");
        if (customBl) bottomStartSymbols.push(customBl);
        const customBr = settings.get("chars.br");
        if (customBr) bottomEndSymbols.push(customBr);

        const text = editor.document.getText();
        const decorationRanges = {
            TODO: [],
            ALERT: [],
            INFO: [],
            WARNING: [],
            STANDARD: [],
        };

        const lines = text.split(/\r?\n/);
        let currentBox = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Comment detection to prevent leaking into code
            const isComment =
                trimmedLine.startsWith("//") ||
                trimmedLine.startsWith("/*") ||
                trimmedLine.startsWith("*");

            // Border/Tag detection
            const borderCharCount = [...trimmedLine].filter((c) =>
                borderChars.includes(c),
            ).length;
            const isLikelyBorder = borderCharCount > 10;
            const tagMatch = trimmedLine.match(/\[(TODO|ALERT|INFO|WARNING)\]/i);

            if (tagMatch) {
                // New tag found, start a new box tracking (abandoning previous if any)
                currentBox = { tag: tagMatch[1].toUpperCase(), startLine: i };
            } else if (isLikelyBorder) {
                const isStartStyle =
                    startSymbols.some((s) => trimmedLine.includes(s)) &&
                    endSymbols.some((s) => trimmedLine.includes(s));
                const isBottomStyle =
                    bottomStartSymbols.some((s) => trimmedLine.includes(s)) &&
                    bottomEndSymbols.some((s) => trimmedLine.includes(s));

                if (currentBox) {
                    if (isBottomStyle) {
                        const range = new vscode.Range(
                            new vscode.Position(currentBox.startLine, 0),
                            new vscode.Position(i, line.length),
                        );
                        decorationRanges[currentBox.tag].push(range);
                        currentBox = null;
                    }
                } else if (isStartStyle) {
                    // If it's both a start and bottom style (like a separator /* === */),
                    // we don't decorate it as STANDARD to keep the default comment color.
                    // Instead, we only start a box if it's not a single-line separator.
                    if (!isBottomStyle) {
                        currentBox = { tag: "STANDARD", startLine: i };
                    }
                }
            } else if (currentBox) {
                // Not a border and not a tag.
                // If it's not a comment, or the box is suspiciously long, abandon it.
                if (!isComment || i - currentBox.startLine > 20) {
                    currentBox = null;
                }
            }
        }

        for (const tag in decorations) {
            editor.setDecorations(decorations[tag], decorationRanges[tag]);
        }
    }

    // Decoration init
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

    // Command registrations
    context.subscriptions.push(
        vscode.commands.registerCommand("better-box-comments.createBox", () => {
            insertBox().then(() => updateDecorations(vscode.window.activeTextEditor));
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
        vscode.commands.registerCommand("better-box-comments.createWarningBox", () => {
            insertBox("WARNING").then(() =>
                updateDecorations(vscode.window.activeTextEditor),
            );
        }),
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
                updateDecorations(editor);
            }
        },
        null,
        context.subscriptions,
    );

    vscode.workspace.onDidChangeConfiguration(
        (event) => {
            if (event.affectsConfiguration("betterBoxComments.colors")) {
                createDecorations();
                vscode.window.visibleTextEditors.forEach((editor) => {
                    updateDecorations(editor);
                });
            }
        },
        null,
        context.subscriptions,
    );

    vscode.window.visibleTextEditors.forEach((editor) => {
        updateDecorations(editor);
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
