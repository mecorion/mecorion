import Cookies from 'js-cookie'

const Theme = 'Theme'

// Theme
export function setTheme(theme) {
    return Cookies.set(Theme, theme, { sameSite: 'strict' }) //, expires: 7 - кол дней
}
export function getTheme() {
    return Cookies.get(Theme)
}
export function removeTheme() {
    return Cookies.remove(Theme)
}