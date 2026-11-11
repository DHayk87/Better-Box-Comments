const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
    PRESETS,
    generateBox,
    getStringWidth,
    parseLines,
} = require("../boxCore");

describe("vs_code_box_comment boxCore", () => {
    it("exports PRESETS and generateBox correctly", () => {
        assert.ok(PRESETS.Default);
        assert.ok(PRESETS.Hash);
        assert.ok(PRESETS.Equals);
        assert.ok(PRESETS.Double);
        assert.equal(typeof generateBox, "function");
    });

    it("generates correctly aligned box comments with tags and dividers", () => {
        const box = generateBox("Testing VSCode\n--\nDivider line", {
            tag: "TODO",
            length: 40,
            indentation: 2,
        });
        const lines = box.split("\n");
        assert.equal(lines.length, 5);
        lines.forEach((line) => {
            assert.equal(getStringWidth(line), 40);
        });
    });

    it("correctly handles wide unicode and emojis", () => {
        const box = generateBox("Rocket: 🚀\nCheck: ✅", { length: 30, indentation: 0 });
        const lines = box.split("\n");
        lines.forEach((line) => {
            assert.equal(getStringWidth(line), 30);
        });
    });
});

