# Better Box Comments

Generate ASCII box comments with "Better Comments" style coloring and persistence in VS Code.

![Better Box Comments](https://raw.githubusercontent.com/PolymerMallard/vscode-box-comment/master/assets/example.gif)

## Features

- **ASCII Generation**: Automatically wrap text into beautiful ASCII boxes.
- **Color Variants**: Color-coded boxes inspired by "Better Comments" (TODO, ALERT, INFO, WARNING).
- **Visual Persistence**: Colored decorations persist even after closing and reopening files.
- **Border Style Presets**: Quickly switch between standard, hash, equals, and double-line styles.
- **Customizable Borders**: Complete control over the characters used for ASCII borders.

## Usage

1. Select the text you want to wrap in a box.
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Search for:
    - `Box: Create Standard Box`
    - `Box: Create TODO Box`
    - `Box: Create Alert Box`
    - `Box: Create INFO Box`
    - `Box: Create Warning Box`

## Configuration

Customizable via VS Code Settings (`betterBoxComments.*`):

| Setting                         | Description                                                           | Default   |
| ------------------------------- | --------------------------------------------------------------------- | --------- |
| `betterBoxComments.borderStyle` | The style of the ASCII border (Default, Hash, Equals, Double, Custom) | `Default` |
| `betterBoxComments.length`      | Total line length of the box                                          | `80`      |
| `betterBoxComments.indentation` | Indent amount for the box                                             | `2`       |
| `betterBoxComments.chars.tl`    | Top-left corner character (used if style is `Custom`)                 | `┌`       |
| `betterBoxComments.chars.tm`    | Top-middle (border) character (used if style is `Custom`)             | `─`       |
| `betterBoxComments.chars.tr`    | Top-right corner character (used if style is `Custom`)                | `┐`       |
| `betterBoxComments.chars.l`     | Left side character (used if style is `Custom`)                       | `│`       |
| `betterBoxComments.chars.r`     | Right side character (used if style is `Custom`)                      | `│`       |
| `betterBoxComments.chars.bl`    | Bottom-left corner character (used if style is `Custom`)              | `└`       |
| `betterBoxComments.chars.bm`    | Bottom-middle (border) character (used if style is `Custom`)          | `─`       |
| `betterBoxComments.chars.br`    | Bottom-right corner character (used if style is `Custom`)             | `┘`       |

## How to Customize

You can tailor the look of your boxes in two ways:

### 1. Using Style Presets (Quickest)

1. Go to **Settings** (`Ctrl+,`).
2. Search for `betterBoxComments.borderStyle`.
3. Choose a preset from the dropdown:
    - **Default**: Rounded corners (┌ ─ ┐).
    - **Hash**: All-around hash (# # #).
    - **Equals**: Double-horizontal (= | =).
    - **Double**: Unicode double lines (╔ ═ ╗).

### 2. Using Custom Characters (Full Control)

1. Set `betterBoxComments.borderStyle` to **Custom**.
2. Customize individual characters by searching for `betterBoxComments.chars`.
3. You can set unique symbols for every corner and border:
    - `tl`, `tm`, `tr` (Top)
    - `l`, `r` (Sides)
    - `bl`, `bm`, `br` (Bottom)
    - `dl`, `dm`, `dr` (Dividers)

### 3. Customizing Colors

You can change the colors of any box variant:

1. Go to **Settings** (`Ctrl+,`).
2. Search for `betterBoxComments.colors`.
3. Use the hex color picker to set your preferred colors for TODO, Alert, Info, etc.
4. Changes take effect immediately!

## Style Examples

### Default Style

```javascript
//  ┌────────────────────────────────────────────────────────────────────────┐
//  │ This is the default rounded border style.                              │
//  └────────────────────────────────────────────────────────────────────────┘
```

### Hash Style

```javascript
//  ##########################################################################
//  # This style uses hashes for all borders and corners.                    #
//  ##########################################################################
```

### Equals Style

```javascript
//  ==========================================================================
//  | This style uses equals for borders and pipes for sides.                |
//  ==========================================================================
```

### Double Line Style

```javascript
//  ╔════════════════════════════════════════════════════════════════════════╗
//  ║ This style uses unicode double lines for a premium look.               ║
//  ╚════════════════════════════════════════════════════════════════════════╝
```

## Better Comments Tags

The extension recognizes the following tags in the top border of the box:

- `[TODO]` (Blue: #3498db)
- `[ALERT]` (Red: #e74c3c)
- `[INFO]` (Green: #2ecc71)
- `[WARNING]` (Orange: #f39c12)
- **Standard** (Grey: #dcdde1 - Default for boxes without tags)

Example:

```javascript
//  ┌── [TODO] ──────────────────────────────────────────────────────────────┐
//  │ This is a colored box that will remain blue when you reopen the file.  │
//  └────────────────────────────────────────────────────────────────────────┘
```

## Credits

Inspired by [vscode-box-comment](https://github.com/PolymerMallard/vscode-box-comment) and [Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments).
