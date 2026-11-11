const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { stripCommentPrefixes } = require("../boxLogic");

describe("boxLogic stripCommentPrefixes", () => {
    it("strips double slash comments when all non-empty lines are commented", () => {
        const input = "// First line\n// Second line";
        const result = stripCommentPrefixes(input);
        assert.equal(result, "First line\nSecond line");
    });

    it("strips hash comments in python/shell scripts", () => {
        const input = "# Step 1\n# Step 2";
        const result = stripCommentPrefixes(input);
        assert.equal(result, "Step 1\nStep 2");
    });

    it("strips SQL/Lua dash-dash comments", () => {
        const input = "-- select query\n-- from users";
        const result = stripCommentPrefixes(input);
        assert.equal(result, "select query\nfrom users");
    });

    it("preserves non-commented code without modification", () => {
        const input = "const x = 10 / 2;\nconst y = 20;";
        const result = stripCommentPrefixes(input);
        assert.equal(result, input);
    });

    it("preserves code with mixed commented and uncommented lines", () => {
        const input = "// Comment\nconst z = 3;";
        const result = stripCommentPrefixes(input);
        assert.equal(result, input);
    });
});

