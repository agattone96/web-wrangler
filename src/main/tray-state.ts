export function shouldCreateTray(showInMenuBar: boolean, hasTray: boolean): boolean {
  return showInMenuBar && !hasTray
}

export function shouldDestroyTray(showInMenuBar: boolean, hasTray: boolean): boolean {
  return !showInMenuBar && hasTray
}
