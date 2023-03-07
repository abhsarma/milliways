export const cell = { width: 32, height: 24, heightCollapsed: 2, padding: 4 };
export const nameContainer = { width: 32, height: 80, padding: 4 };
export const groupPadding = 20;
export const header = {size: 14, top: 30, right: 0, bottom: 0, left: 0};
export const text = 12;
export const outcomeVisWidth = 240;
export const margin = {top: 40, right: 20, bottom: 15, left: 40};
export const iconSize = 24;
export const namingDim = (iconSize + cell.padding) + nameContainer.height;
export const windowHeight = (window.innerHeight - 64 - 40 - 16 - 16); // 64 + 40: height of header + margin; 16 + 16 : padding top + bottom
export const scrollbarWidth = 12;
export const gridNamesHeight = margin.top + 4 * cell.padding + iconSize + namingDim; // yscale(0)
export const popup = {width: 280, padding: 16, shift: 16}
