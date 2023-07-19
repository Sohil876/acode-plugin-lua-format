import plugin from "../plugin.json";
const { Beautify } = require("lua-format");

const pluginId = plugin.id;
const appSettings = acode.require("settings");

const formatterSettings = {
    RenameVariables: false,
    RenameGlobals: false,
    SolveMath: false,
};

class AcodeLuaFormat {
    worker = null;

    constructor() {
        this.run = this.run.bind(this);
    }

    static inferParser(filename) {
        switch (filename.slice(filename.lastIndexOf(".") + 1)) {
            case "lua":
                return "lua";

            default:
                return null;
        }
    }

    async init() {
        const extensions = ["lua"];
        acode.registerFormatter(pluginId, extensions, this.run);
    }

    async run() {
        const { editor, activeFile } = editorManager;
        const { session } = activeFile;
        const code = editor.getValue();
        const cursorPos = editor.getCursorPosition();
        const parser = AcodeLuaFormat.inferParser(activeFile.name);
        const cursorOptions = {
            parser,
            cursorOffset: this.#cursorPosTocursorOffset(cursorPos),
            filepath: activeFile.name,
            tabWidth: appSettings.value.tabSize,
        };
        this.#setValue(session, await Beautify(code, formatterSettings));
    }

    async destroy() {
        acode.unregisterFormatter(plugin.id);
    }

    #cursorPosTocursorOffset(cursorPos) {
        let { row, column } = cursorPos;
        const { editor } = editorManager;
        const lines = editor.getValue().split("\n");
        for (let i = 0; i < row - 1; i++) {
            column += lines[i].length;
        }
        return column;
    }

    #cursorOffsetTocursorPos(cursorOffset) {
        const { editor } = editorManager;
        const lines = editor.getValue().split("\n");
        let row = 0;
        let column = 0;
        for (let i = 0; i < lines.length; i++) {
            if (column + lines[i].length >= cursorOffset) {
                row = i;
                column = cursorOffset - column;
                break;
            }
            column += lines[i].length;
        }
        return {
            row,
            column,
        };
    }

    #setValue(session, formattedCode) {
        const { $undoStack, $redoStack, $rev, $mark } = Object.assign(
            {},
            session.getUndoManager()
        );
        session.setValue(formattedCode);
        const undoManager = session.getUndoManager();
        undoManager.$undoStack = $undoStack;
        undoManager.$redoStack = $redoStack;
        undoManager.$rev = $rev;
        undoManager.$mark = $mark;
        const { row, column } = this.#cursorOffsetTocursorPos(
            formattedCode.cursorOffset
        );
        session.selection.moveCursorTo(row, column);
    }
}

if (window.acode) {
    const acodePlugin = new AcodeLuaFormat();
    acode.setPluginInit(
        plugin.id,
        async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
            if (!baseUrl.endsWith("/")) {
                baseUrl += "/";
            }
            acodePlugin.baseUrl = baseUrl;
            await acodePlugin.init($page, cacheFile, cacheFileUrl);
        }
    );
    acode.setPluginUnmount(plugin.id, () => {
        acodePlugin.destroy();
    });
}
