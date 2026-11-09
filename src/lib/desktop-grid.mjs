// Desktop icon grid: where icons sit, snapping, and the rubber-band selection box.
// Positions are stored as grid cells ({col, row}), filled top-to-bottom then left-to-right, like Windows.

export const CELL_SIZES = {
  small: { width: 80, height: 86 },
  medium: { width: 92, height: 100 },
  large: { width: 112, height: 122 },
};
export const GRID_PADDING = { x: 12, y: 12 };

export function gridSize(bounds, cell) {
  return {
    cols: Math.max(1, Math.floor((bounds.width - GRID_PADDING.x * 2) / cell.width)),
    rows: Math.max(1, Math.floor((bounds.height - GRID_PADDING.y * 2) / cell.height)),
  };
}

export function cellToPoint({ col, row }, cell) {
  return { x: GRID_PADDING.x + col * cell.width, y: GRID_PADDING.y + row * cell.height };
}

export function pointToCell({ x, y }, cell, grid) {
  return {
    col: Math.min(grid.cols - 1, Math.max(0, Math.round((x - GRID_PADDING.x) / cell.width))),
    row: Math.min(grid.rows - 1, Math.max(0, Math.round((y - GRID_PADDING.y) / cell.height))),
  };
}

const key = ({ col, row }) => col + "," + row;
const inside = (c, grid) => c && c.col >= 0 && c.row >= 0 && c.col < grid.cols && c.row < grid.rows;

/** The free cell closest to `target` (column-major order breaks ties). */
export function nearestFreeCell(target, taken, grid) {
  let best = null;
  let bestDistance = Infinity;
  for (let col = 0; col < grid.cols; col++) {
    for (let row = 0; row < grid.rows; row++) {
      if (taken.has(col + "," + row)) continue;
      const distance = (col - target.col) ** 2 + (row - target.row) ** 2;
      if (distance < bestDistance) { best = { col, row }; bestDistance = distance; }
    }
  }
  return best;
}

/**
 * Places every icon. Saved positions are kept when they still fit the screen and don't collide;
 * everything else goes into the next free cell (top-to-bottom, then the next column).
 */
export function layoutIcons(ids, saved, grid) {
  const layout = {};
  const taken = new Set();
  for (const id of ids) {
    const cell = saved?.[id];
    if (inside(cell, grid) && !taken.has(key(cell))) { layout[id] = { col: cell.col, row: cell.row }; taken.add(key(cell)); }
  }
  for (const id of ids) {
    if (layout[id]) continue;
    const cell = firstFreeCell(taken, grid) ?? { col: 0, row: 0 };
    layout[id] = cell;
    taken.add(key(cell));
  }
  return layout;
}

/** The first free cell going down each column, left to right. */
function firstFreeCell(taken, grid) {
  for (let col = 0; col < grid.cols; col++) {
    for (let row = 0; row < grid.rows; row++) {
      if (!taken.has(col + "," + row)) return { col, row };
    }
  }
  return null;
}

/** Where a dragged icon lands: the cell under it, or the nearest free one if that's taken. */
export function dropCell(layout, id, target, grid) {
  const taken = new Set(Object.entries(layout).filter(([other]) => other !== id).map(([, cell]) => key(cell)));
  if (!taken.has(key(target))) return target;
  // The target is occupied: find the nearest free cell, but not the one we just left
  // (otherwise the icon would look like it refused to move).
  if (layout[id]) taken.add(key(layout[id]));
  return nearestFreeCell(target, taken, grid) ?? layout[id];
}

/** Icons whose cell overlaps the rubber-band rectangle {x, y, width, height}. */
export function iconsInRect(rect, layout, cell) {
  const left = Math.min(rect.x, rect.x + rect.width);
  const top = Math.min(rect.y, rect.y + rect.height);
  const right = Math.max(rect.x, rect.x + rect.width);
  const bottom = Math.max(rect.y, rect.y + rect.height);
  return Object.entries(layout).filter(([, position]) => {
    const p = cellToPoint(position, cell);
    // Use the visible icon box (a little inset from the cell) so near misses don't select.
    const box = { left: p.x + 6, top: p.y + 4, right: p.x + cell.width - 6, bottom: p.y + cell.height - 4 };
    return box.left < right && box.right > left && box.top < bottom && box.bottom > top;
  }).map(([id]) => id);
}
