const vscode = require("vscode");
const { insertBox } = require("./boxLogic");

let decorations = {};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log("Better Box Comments is now active!");

    // Initialize decorations
    createDecorations();

    // Helper to refresh decorations in a document
    function updateDecorations(editor) {
        if (!editor || !decorations) return;

        const settings = vscode.workspace.getConfiguration("betterBoxComments");

        // Symbols to look for (Current ones + Presets)
        const startSymbols = ["┌", "#", "=", "╔"];
        const endSymbols = ["┐", "#", "=", "╗"];
        const bottomStartSymbols = ["└", "#", "=", "╚"];
        const bottomEndSymbols = ["┘", "#", "=", "╝"];
        const borderChars = [
            "┌",
            "┐",
            "└",
            "┘",
            "├",
            "┤",
            "─",
            "╔",
            "╗",
            "╚",
            "╝",
            "╠",
            "╣",
            "═",
            "║",
            "#",
            "=",
        ];

        // Add current custom ones
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

            // 1. Identify if it's a border line
            const borderCharCount = [...trimmedLine].filter((c) =>
                borderChars.includes(c),
            ).length;
            const isLikelyBorder = borderCharCount > 10;
            const tagMatch = trimmedLine.match(/\[(TODO|ALERT|INFO|WARNING)\]/i);

            // 2. Logic to detect start and end
            if (tagMatch) {
                // If we find a tag, it ALWAYS starts a new colored box
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
                    currentBox = { tag: "STANDARD", startLine: i };
                }
            }
        }

        // Apply decorations
        for (const tag in decorations) {
            editor.setDecorations(decorations[tag], decorationRanges[tag]);
        }
    }

    // Function to create/recreate decorations with current colors
    function createDecorations() {
        // Dispose existing decorations if any
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

    // Register Commands
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

    // Event Listeners for Persistence
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

    // Handle configuration changes
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

    // Initial scan of visible editors
    vscode.window.visibleTextEditors.forEach((editor) => {
        updateDecorations(editor);
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
