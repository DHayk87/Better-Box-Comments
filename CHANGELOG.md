# Changelog

All notable changes to the "Better Box Comments" extension will be documented in this file.

## [0.2.0]

### Added
- **Custom Tag Command**: New `Box: Create Box with Custom Tag...` command allowing dynamic creation of boxes with any tag name (e.g., `[NOTE]`, `[FIXME]`, `[BUG]`).
- **Keyboard Shortcuts**: Added default shortcuts `Ctrl+Alt+B` / `Cmd+Alt+B` (Standard Box) and `Ctrl+Alt+T` / `Cmd+Alt+T` (TODO Box).
- **Editor Context Menu**: Right-click in the editor to access a new **"Better Box Comments"** submenu for quick creation.
- **Multi-Language Comment Support**: Extended comment detection to support Python, Bash, Ruby, YAML (`#`), SQL, Lua (`--`), HTML/XML (`<!--`), and more.
- **Configurable Box Length**: Added `betterBoxComments.maxBoxLines` setting (default 200).
- **Automated CI/CD**: Added GitHub Actions workflows for multi-OS testing and automated marketplace publishing.

### Fixed
- **Standard Box Detection in Hash & Equals Styles**: Fixed bug where standard boxes using `#` or `=` borders were never colored.
- **Crash Prevention on Small Lengths**: Fixed infinite loop and `RangeError` heap crashes when small box lengths were provided.
- **Divider Width Alignment**: Corrected inner divider width calculation so internal dividers (`--`) match outer borders.
- **False Divider Triggers**: Fixed bug where normal code lines starting with `#` or `=` (e.g., `#include`) were mistreated as dividers.
- **Unicode & Emoji Alignment**: Implemented visual display column calculation ensuring wide CJK characters and emojis (`🚀`, `✅`) align borders.
- **Duplicate Comment Markers**: Automatically strips existing comment prefixes from selected lines before wrapping.
- **Typing Performance**: Added 120ms debouncing and symbol caching on document edits.
- **Marketplace Package Fixes**: Removed `CHANGELOG.md` from `.vscodeignore` so release notes appear on the Marketplace.

## [0.1.1] - 2026-02-25

### Fixed

- **Decoration Leakage**: Fixed a bug where comment separators (like `/* === */`) would cause subsequent code to be incorrectly colored.
- **Improved Detection**: Added "Box Abandonment" logic to stop decorations if non-comment code is encountered.
- **Separator Handling**: Refined logic so that single-line separators without tags maintain the default editor theme's comment color.

## [0.1.0] - 2026-02-18

### Added

- Initial release of Better Box Comments.
- ASCII box generation with text wrapping.
- "Better Comments" style color coding (TODO, ALERT, INFO, WARNING).
- Support for multiple border presets (Hash, Equals, Double Line).
- Customizable border symbols and line length.
- Customizable hex colors for box variants.
- Visual persistence of colors across editor sessions.
- Extension logo and repository metadata.
- `.gitignore` and initialized Git repository.
