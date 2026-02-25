# Changelog

All notable changes to the "Better Box Comments" extension will be documented in this file.

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
