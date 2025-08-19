const GRID_SIZE = 6;
const TARGET_COUNT = GRID_SIZE / 2;

const isPlacementValid = (grid, r, c, hCons, vCons) => {
    const val = grid[r][c];
    if (val === 0) return true;

    // 1. Adjacency rule: No more than 2 of the same symbol
    // Horizontal check
    if (c > 0 && c < GRID_SIZE - 1 && grid[r][c - 1] === val && grid[r][c + 1] === val) return false;
    if (c > 1 && grid[r][c - 1] === val && grid[r][c - 2] === val) return false;
    if (c < GRID_SIZE - 2 && grid[r][c + 1] === val && grid[r][c + 2] === val) return false;

    // Vertical check
    if (r > 0 && r < GRID_SIZE - 1 && grid[r - 1][c] === val && grid[r + 1][c] === val) return false;
    if (r > 1 && grid[r - 1][c] === val && grid[r - 2][c] === val) return false;
    if (r < GRID_SIZE - 2 && grid[r + 1][c] === val && grid[r + 2][c] === val) return false;

    // 2. Balance rule: Not more than TARGET_COUNT of each symbol per row/col
    let sunCountRow = 0, moonCountRow = 0;
    let sunCountCol = 0, moonCountCol = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
        if (grid[r][i] === 1) sunCountRow++;
        else if (grid[r][i] === -1) moonCountRow++;

        if (grid[i][c] === 1) sunCountCol++;
        else if (grid[i][c] === -1) moonCountCol++;
    }
    if (sunCountRow > TARGET_COUNT || moonCountRow > TARGET_COUNT) return false;
    if (sunCountCol > TARGET_COUNT || moonCountCol > TARGET_COUNT) return false;
    
    // 3. Constraint rule: Check against filled neighbors
    const neighbors = [
        { nr: r - 1, nc: c, dir: 'h', cr: r - 1, cc: c }, // Up
        { nr: r + 1, nc: c, dir: 'h', cr: r, cc: c },     // Down
        { nr: r, nc: c - 1, dir: 'v', cr: r, cc: c - 1 }, // Left
        { nr: r, nc: c + 1, dir: 'v', cr: r, cc: c },     // Right
    ];

    for (const { nr, nc, dir, cr, cc } of neighbors) {
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            const neighborVal = grid[nr][nc];
            if (neighborVal !== 0) {
                const constraint = dir === 'h' ? hCons[cr][cc] : vCons[cr][cc];
                if (constraint === 1 && val !== neighborVal) return false; // '='
                if (constraint === -1 && val === neighborVal) return false; // 'X'
            }
        }
    }

    return true;
};

const isBoardCompleteAndValid = (grid) => {
    for (let i = 0; i < GRID_SIZE; i++) {
        let sunCountRow = 0, moonCountRow = 0;
        let sunCountCol = 0, moonCountCol = 0;
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] === 1) sunCountRow++;
            else if (grid[i][j] === -1) moonCountRow++;

            if (grid[j][i] === 1) sunCountCol++;
            else if (grid[j][i] === -1) moonCountCol++;
        }
        if (sunCountRow !== TARGET_COUNT || moonCountRow !== TARGET_COUNT) return false;
        if (sunCountCol !== TARGET_COUNT || moonCountCol !== TARGET_COUNT) return false;
    }
    return true;
}

const findEmpty = (grid) => {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === 0) {
                return [r, c];
            }
        }
    }
    return null;
};

// This function will be available in the global scope of the injected script execution context.
const solve = (grid, hCons, vCons) => {
    const find = findEmpty(grid);
    if (!find) {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (!isPlacementValid(grid, r, c, hCons, vCons)) return false;
            }
        }
        return isBoardCompleteAndValid(grid);
    }

    const [r, c] = find;

    for (const val of [1, -1]) { // 1 for sun, -1 for moon
        grid[r][c] = val;
        if (isPlacementValid(grid, r, c, hCons, vCons)) {
            if (solve(grid, hCons, vCons)) {
                return true;
            }
        }
    }

    grid[r][c] = 0; // Backtrack
    return false;
};
