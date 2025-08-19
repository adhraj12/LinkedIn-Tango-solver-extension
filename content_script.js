// This script is injected when you click the extension icon on a LinkedIn page.

(async function() {
    console.log("Tango Solver Extension: Script injected.");

    // ======================== SELECTOR CONFIGURATION ========================
    const GRID_CONTAINER_SELECTOR = '.lotka-grid';
    const CELL_SELECTOR = '.lotka-cell';
    const GRID_SIZE = 6;

    /**
     * Shows a feedback message on the screen.
     */
    function showFeedback(message, isError = false) {
        let indicator = document.getElementById('tango-solver-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'tango-solver-indicator';
            indicator.style.position = 'fixed';
            indicator.style.top = '20px';
            indicator.style.right = '20px';
            indicator.style.padding = '12px 20px';
            indicator.style.color = 'white';
            indicator.style.borderRadius = '8px';
            indicator.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            indicator.style.zIndex = '99999';
            indicator.style.fontFamily = 'system-ui, -apple-system, sans-serif';
            indicator.style.fontSize = '16px';
            indicator.style.fontWeight = '500';
            indicator.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = message;
        indicator.style.backgroundColor = isError ? '#c53030' : '#2f855a';
        indicator.style.opacity = '1';

        setTimeout(() => {
            if (indicator) indicator.style.opacity = '0';
        }, 4000);
        setTimeout(() => {
             if (indicator) indicator.remove();
        }, 4300);
    }

    /**
     * Reads the current state of the Tango puzzle from the DOM.
     * @returns {{grid: number[][], hCons: number[][], vCons: number[][], cells: HTMLElement[]}|null}
     */
    function readGrid() {
        const gridContainer = document.querySelector(GRID_CONTAINER_SELECTOR);
        if (!gridContainer) {
            showFeedback(`❌ Grid container not found. Check selector: ${GRID_CONTAINER_SELECTOR}`, true);
            return null;
        }

        const cells = Array.from(gridContainer.querySelectorAll(CELL_SELECTOR));
        if (cells.length !== GRID_SIZE * GRID_SIZE) {
            showFeedback(`❌ Found only ${cells.length}/${GRID_SIZE * GRID_SIZE} cells. Check selector: ${CELL_SELECTOR}`, true);
            return null;
        }

        const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
        const hCons = Array.from({ length: GRID_SIZE - 1 }, () => Array(GRID_SIZE).fill(0));
        const vCons = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE - 1).fill(0));
        
        cells.forEach(cell => {
            const idxAttr = cell.getAttribute('data-cell-idx');
            if (idxAttr === null) return;
            const idx = parseInt(idxAttr, 10);
            const r = Math.floor(idx / GRID_SIZE);
            const c = idx % GRID_SIZE;

            // Read Symbols
            if (cell.querySelector('svg[aria-label="Sun"]')) {
                grid[r][c] = 1;
            } else if (cell.querySelector('svg[aria-label="Moon"]')) {
                grid[r][c] = -1;
            }

            // Read Horizontal Constraints (below the cell)
            if (r < GRID_SIZE - 1) {
                const hWall = cell.querySelector('.lotka-cell-edge--down');
                if (hWall) {
                    const label = hWall.querySelector('svg')?.getAttribute('aria-label');
                    if (label === 'Equal') hCons[r][c] = 1;
                    else if (label === 'Cross') hCons[r][c] = -1;
                }
            }

            // Read Vertical Constraints (to the right of the cell)
            if (c < GRID_SIZE - 1) {
                const vWall = cell.querySelector('.lotka-cell-edge--right');
                if (vWall) {
                    const label = vWall.querySelector('svg')?.getAttribute('aria-label');
                    if (label === 'Equal') vCons[r][c] = 1;
                    else if (label === 'Cross') vCons[r][c] = -1;
                }
            }
        });

        return { grid, hCons, vCons, cells };
    }

    /**
     * Fills the solved symbols into the grid on the webpage.
     */
    function fillGrid(solution, originalGrid, cells) {
        const sunTemplate = document.querySelector('svg[aria-label="Sun"]')?.cloneNode(true);
        const moonTemplate = document.querySelector('svg[aria-label="Moon"]')?.cloneNode(true);
        
        if (!sunTemplate || !moonTemplate) {
            showFeedback('⚠️ Could not find icon templates to display solution.', true);
            return;
        }

        cells.forEach((cell, index) => {
            const r = Math.floor(index / GRID_SIZE);
            const c = index % GRID_SIZE;

            if (originalGrid[r][c] === 0) { // Only fill originally empty cells
                const contentDiv = cell.querySelector('.lotka-cell-content');
                if (!contentDiv) return;

                // Clear any existing content
                contentDiv.innerHTML = '';

                let icon;
                if (solution[r][c] === 1) { // Sun
                    icon = sunTemplate.cloneNode(true);
                } else if (solution[r][c] === -1) { // Moon
                    icon = moonTemplate.cloneNode(true);
                }

                if (icon) {
                    // Style the solved icons to distinguish them
                    icon.style.opacity = '0.75';
                    contentDiv.appendChild(icon);
                    // Add a highlight to the solved cell
                    cell.style.boxShadow = 'inset 0 0 0 3px #f59e0b'; // orange glow
                }
            }
        });
    }

    // Main execution block
    try {
        showFeedback('🤖 Solving Tango...');
        
        const result = readGrid();
        if (result) {
            const { grid, hCons, vCons, cells } = result;
            const originalGrid = JSON.parse(JSON.stringify(grid));

            // The `solve` function is globally available because solver.js was injected first.
            if (solve(grid, hCons, vCons)) {
                fillGrid(grid, originalGrid, cells);
                showFeedback('✅ Puzzle Solved!');
            } else {
                showFeedback('❌ No solution could be found.', true);
            }
        }
    } catch (error) {
        console.error("Tango Solver Error:", error);
        showFeedback(`❌ An unexpected error occurred: ${error.message}`, true);
    }
})();