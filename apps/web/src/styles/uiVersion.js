export const UI_VERSIONS = ["v1", "v2"];

const STORAGE_KEY = "mecorion-ui-version";
const STYLE_ELEMENT_ID = "mecorion-ui-library";
const libraryLoaders = {
    v1: () => import("./v1/main.scss?inline"),
    v2: () => import("./v2/main.scss?inline"),
};

function normalizeUiVersion(version) {
    return UI_VERSIONS.includes(version) ? version : "v1";
}

export function getStoredUiVersion() {
    if (typeof window === "undefined") {
        return "v1";
    }

    return normalizeUiVersion(window.localStorage.getItem(STORAGE_KEY));
}

export async function applyUiVersion(version, {persist = true} = {}) {
    const normalizedVersion = normalizeUiVersion(version);
    const {default: libraryStyles} = await libraryLoaders[normalizedVersion]();
    let styleElement = document.getElementById(STYLE_ELEMENT_ID);

    if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = STYLE_ELEMENT_ID;
        document.head.append(styleElement);
    }

    styleElement.textContent = libraryStyles;
    document.documentElement.dataset.uiVersion = normalizedVersion;

    if (persist) {
        window.localStorage.setItem(STORAGE_KEY, normalizedVersion);
    }

    return normalizedVersion;
}

export async function initializeUiVersion() {
    return applyUiVersion(getStoredUiVersion(), {persist: false});
}
