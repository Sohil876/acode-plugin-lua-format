import plugin from "../plugin.json";

const formatterSettings = {
    RenameVariables: false,
    RenameGlobals: false,
    SolveMath: false,
};

class AcodeLuaFormat {
    async init() {}

    async destroy() {}
}

if (window.acode) {
    const acodePlugin = new AcodeLuaFormat();
    acode.setPluginInit(
        plugin.id,
        (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
            if (!baseUrl.endsWith("/")) {
                baseUrl += "/";
            }
            acodePlugin.baseUrl = baseUrl;
            acodePlugin.init($page, cacheFile, cacheFileUrl);
        }
    );
    acode.setPluginUnmount(plugin.id, () => {
        acodePlugin.destroy();
    });
}
