/***************************************************************
 *
 *  Copyright notice
 *
 *  (c) 2018 Silvan Strübi <silvan.struebi@gmail.com>
 *
 *  All rights reserved
 ***************************************************************/

export default class MasterDrag {
    constructor(ProxifyHook, interact) {
        this.__ = ProxifyHook
        this.interact = interact
    }
    start(element) {
        const __ = this.__

        /* temp */
        const minSize = 100
        const body = __(document.getElementsByTagName('body')[0])
        /* /temp */

        element.$func(grid => {
            let transform // keep last transform value on style
            let dragPoint = [0, 0] // [row, column] started at first click within the target cell, to figure at which cell within the target got clicked, since this can span multiple cells
            let initRect // resizing initial rect
            let overlayGrid // overlayGrid container
            const selector = Array.from(grid.children).reduce((acc, child) => child.tagName && !acc.includes(child.tagName) ? acc.concat([child.tagName]) : acc, []).join(',') || '*'
            this.interact(selector, { context: grid.__raw__ })
                .draggable({
                    autoScroll: true,
                    inertia: true, // Inertia allows drag and resize actions to continue after the user releases the pointer at a fast enough speed. http://interactjs.io/docs/inertia/
                    onstart: (event) => {
                        __(event.target)
                            .$getStyle((cell, prop, style) => {
                                style
                                    .$getTransform((style, prop, trans) => transform = trans || 'none')
                                    .$setTransform('none')
                                dragPoint = this.calcPoint(cell, cell, [event.pageX, event.pageY], 'floor')
                                overlayGrid = this.drawOverlayGrid(__, body, grid, cell)
                            })
                    },
                    onmove: (event) => {
                        __(event.target)
                            .$getStyle((cell, prop, style) => {
                                const [str, x, y] = style.transform.match(/.*?\(([-0-9]*)[^0-9-]*([-0-9]*)/) || ['', 0, 0]
                                style.$setTransform(`translate(${Math.round(Number(x) + event.dx)}px, ${Math.round(Number(y) + event.dy)}px)`)
                            })
                    },
                    onend: (event) => {
                        __(event.target)
                            .$getStyle((cell, prop, style) => {
                                // reset translate, otherwise cell coordinates will be off
                                style.$setTransform('none')
                                const dropPoint = this.calcPoint(grid, cell, [event.pageX, event.pageY], 'ceil')
                                style
                                    .$setGridRowStart(dropPoint[1] - dragPoint[1] > 0 ? dropPoint[1] - dragPoint[1] : 1)
                                    .$setGridColumnStart(dropPoint[0] - dragPoint[0] > 0 ? dropPoint[0] - dragPoint[0] : 1)
                                    .$setTransform(transform)
                                cell.classList.add('dragged')
                                overlayGrid.remove()
                            })
                    }
                })
                .resizable({
                    autoScroll: true,
                    edges: { left: false, right: true, bottom: true, top: false },
                    inertia: true, // Inertia allows drag and resize actions to continue after the user releases the pointer at a fast enough speed. http://interactjs.io/docs/inertia/
                    restrictSize: {
                        min: { width: minSize, height: minSize },
                    }
                })
                .on('resizestart', (event) => {
                    __(event.target)
                        .$getStyle((cell, prop, style) => {
                            style
                                .$getTransform((style, prop, trans) => transform = trans)
                                .$setTransform('none')
                                .$setTransformOrigin(`top left`)
                            initRect = this.getBoundingClientRectAbsolute(cell)
                            overlayGrid = this.drawOverlayGrid(__, body, grid, cell)
                        })
                })
                .on('resizemove', (event) => {
                    __(event.target)
                        .$getStyle((cell, prop, style) => {
                            style.$setTransform(`scale(${parseFloat(event.rect.width / initRect.width).toFixed(3)}, ${parseFloat(event.rect.height / initRect.height).toFixed(3)})`)
                        })
                })
                .on('resizeend', (event) => {
                    __(event.target)
                        .$getStyle((cell, prop, style) => {
                            const cellRect = this.getBoundingClientRectAbsolute(cell)
                            const singleCellRect = this.getCellRect(cell, initRect)
                            style
                                .$setGridRowEnd(`span ${Math.round(cellRect.height / singleCellRect.height)}`)
                                .$setGridColumnEnd(`span ${Math.round(cellRect.width / singleCellRect.width)}`)
                                .$setTransform(transform)
                            cell.classList.add('resized')
                            overlayGrid.remove()
                        })
                })
                .on('doubletap', (event) => {
                    // zIndex swapping
                    __(event.target)
                        .$getStyle((cell, prop, style) => {
                            const zIndex = Number(style.$getZIndex())
                            style.$setZIndex(!zIndex || zIndex <= 1 ? 100 - 1 : zIndex - 1)
                        })
                })
        })
    }
    // calculates the point of [column, row] within the grid
    calcPoint(grid, cell, cors, mathFunc = 'ceil') {
        const gridRect = this.getBoundingClientRectAbsolute(grid)
        const cellRect = this.getCellRect(cell)
        const [x, y] = [cors[0] - gridRect.left, cors[1] - gridRect.top]
        return [Math[mathFunc](x / cellRect.width), Math[mathFunc](y / cellRect.height)]
    }
    // calculates the bounding rectangle of one cell within the grid (takes in account when an item spans multiple cells)
    getCellRect(cell, rect = undefined) {
        const regex = /span\s*/
        const cellRect = rect ? rect : this.getBoundingClientRectAbsolute(cell)
        cell.style
            .$getGridRowEnd((cell, prop, end = '1') => {
                const rows = Number(end.replace(regex, '')) || 1
                cellRect.bottom = (cellRect.bottom - cellRect.top) / rows + cellRect.top
                cellRect.height = cellRect.height / rows
            })
            .$getGridColumnEnd((cell, prop, end = '1') => {
                const columns = Number(end.replace(regex, '')) || 1
                cellRect.right = (cellRect.right - cellRect.left) / columns + cellRect.left
                cellRect.width = cellRect.width / columns
            })
        return cellRect
    }
    // getBoundingClientRect with adjusted coordinates according to window scroll cors
    getBoundingClientRectAbsolute(node) {
        const rect = node.getBoundingClientRect().toJSON()
        return Object.assign(rect, { top: rect.top + window.scrollY, right: rect.right + window.scrollX, bottom: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
    }
    // draw grid lines
    drawOverlayGrid(__, body, grid, cell) {
        const gridRect = this.getBoundingClientRectAbsolute(grid)
        const cellRect = this.getCellRect(cell)
        const rows = Math.round(gridRect.height / cellRect.height)
        const columns = Math.round(gridRect.width / cellRect.width)
        const additional = 3
        return body
            .appendChild(__('section'))
            .$getClassList((receiver, prop, classList) => classList.add('overlay'))
            .$setStyle(`
              background: none;
              box-shadow: none;
              height: ${gridRect.height}px;
              left: ${gridRect.left}px;
              position: absolute;
              top: ${gridRect.top}px;
              width: ${gridRect.width}px;
            `)
            .$func(overlayGrid => {
                for (let i = 0; i < rows + additional; i++) {
                    const lastRow = i === rows + additional - 1
                    for (let j = 0; j < columns + additional; j++) {
                        const lastColumn = j === columns + additional - 1
                        overlayGrid
                            .appendChild(__('div'))
                            .$setStyle(`
                      ${!lastRow ? `border-bottom: 1px dashed rgba(148, 0, 255, .6);` : ''}
                      ${!lastColumn ? `border-right: 1px dashed rgba(148, 0, 255, .6);` : ''}
                      height: ${cellRect.height}px;
                      left: ${cellRect.width * j}px;
                      position: absolute;
                      top: ${cellRect.height * i}px;
                      width: ${cellRect.width}px;
                    `)
                    }
                }
            })
    }
}