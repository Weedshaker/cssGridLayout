/***************************************************************
 *
 *  Copyright notice
 *
 *  (c) 2018 Silvan Strübi <weedshaker@gmail.com>
 *
 *  All rights reserved
 ***************************************************************/

export default class MasterInteract {
  constructor (ProxifyHook, interact, body = null, minWidth = 10, minHeight = 100) {
    this.__ = ProxifyHook
    this.interact = interact
    this.body = body
    this.minWidth = minWidth
    this.minHeight = minHeight

    this.events = {}
  }

  start (element, body = this.body, minWidth = this.minWidth, minHeight = this.minHeight, __ = this.__) {
    this.setBodyScrollFix()
    body = __(body || document.body)
    __(element).$func(grid => {
      let transform // keep last transform value on style
      let dragPoint = [0, 0] // [row, column] started at first click within the target cell, to figure at which cell within the target got clicked, since this can span multiple cells
      let initRect // resizing initial rect
      let overlayGrid // overlayGrid container
      const selector = Array.from(grid.children).reduce((acc, child) => child.tagName && !acc.includes(child.tagName) ? acc.concat([child.tagName]) : acc, []).join(',') || '*'
      this.interact(selector, { context: grid.__raw__ })
        .draggable({
          autoScroll: true,
          inertia: true, // Inertia allows drag and resize actions to continue after the user releases the pointer at a fast enough speed. http://interactjs.io/docs/inertia/
        })
        .styleCursor(true)
        .on('dragstart', (this.events.dragstart = event => {
          __(event.target)
            .$getStyle((cell, prop, style) => {
              style
                .$getTransform((style, prop, trans) => (transform = trans || 'none'))
                .$setTransform('none')
              cell.classList.add('moving')
              dragPoint = this.calcPoint(cell, cell, [event.pageX, event.pageY], 'floor')
              overlayGrid = this.drawOverlayGrid(__, body, grid, cell)
            })
        }))
        .on('dragmove', (this.events.dragmove = event => {
          __(event.target)
            .$getStyle((cell, prop, style) => {
              const [str, x, y] = style.transform.match(/.*?\(([-0-9]*)[^0-9-]*([-0-9]*)/) || ['', 0, 0] // eslint-disable-line
              style.$setTransform(`translate(${Math.round(Number(x) + event.dx)}px, ${Math.round(Number(y) + event.dy)}px)`)
            })
        }))
        .on('dragend', (this.events.dragend = event => {
          __(event.target)
            .$getStyle((cell, prop, style) => {
              // reset translate, otherwise cell coordinates will be off
              style.$setTransform('none')
              const dropPoint = this.calcPoint(grid, cell, [event.pageX, event.pageY], 'ceil')
              style
                .$setGridRowStart(dropPoint[1] - dragPoint[1] > 0 ? dropPoint[1] - dragPoint[1] : 1)
                .$setGridColumnStart(dropPoint[0] - dragPoint[0] > 0 ? dropPoint[0] - dragPoint[0] : 1)
                .$setTransform(transform)
              cell.classList.remove('moving')
              cell.classList.add('dragged')
              overlayGrid.remove()
            })
        }))
        .resizable({
          autoScroll: true,
          edges: { left: false, right: true, bottom: true, top: false },
          inertia: true, // Inertia allows drag and resize actions to continue after the user releases the pointer at a fast enough speed. http://interactjs.io/docs/inertia/
          restrictSize: {
            min: { width: minWidth, height: minHeight }
          }
        })
        .on('resizestart', (this.events.resizestart = event => {
          __(event.target)
            .$getStyle((cell, prop, style) => {
              style
                .$getTransform((style, prop, trans) => (transform = trans))
                .$setTransform('none')
                .$setTransformOrigin('top left')
              cell.classList.add('resizing')
              initRect = this.getBoundingClientRectAbsolute(cell)
              overlayGrid = this.drawOverlayGrid(__, body, grid, cell)
            })
        }))
        .on('resizemove', (this.events.resizemove = event => {
          __(event.target)
            .$getStyle((cell, prop, style) => {
              // @ts-ignore
              style.$setTransform(`scale(${parseFloat(event.rect.width / initRect.width).toFixed(3)}, ${parseFloat(event.rect.height / initRect.height).toFixed(3)})`)
            })
        }))
        .on('resizeend', (this.events.resizeend = event => {
          __(event.target)
            .$getStyle((cell, prop, style) => {
              const cellRect = this.getBoundingClientRectAbsolute(cell)
              const singleCellRect = this.getCellRect(cell, initRect)
              style
                .$setGridRowEnd(`span ${Math.round(cellRect.height / singleCellRect.height)}`)
                .$setGridColumnEnd(`span ${Math.round(cellRect.width / singleCellRect.width)}`)
                .$setTransform(transform)
              cell.classList.remove('resizing')
              cell.classList.add('resized')
              overlayGrid.remove()
            })
        }))
        .on('doubletap', (this.events.doubletap = event => {
          // zIndex swapping
          __(event.target)
            .$getStyle((cell, prop, style) => {
              const zIndex = Number(style.$getZIndex())
              style.$setZIndex(!zIndex || zIndex <= 1 ? 100 - 1 : zIndex - 1)
            })
        }))
    })
  }

  stop (element, __ = this.__) {
    __(element).$func(grid => {
      const selector = Array.from(grid.children).reduce((acc, child) => child.tagName && !acc.includes(child.tagName) ? acc.concat([child.tagName]) : acc, []).join(',') || '*'
      this.interact(selector, { context: grid.__raw__ })
        .styleCursor(false)
        .off('dragstart', this.events.dragstart)
        .off('dragmove', this.events.dragmove)
        .off('dragend', this.events.dragend)
        .off('resizestart', this.events.resizestart)
        .off('resizemove', this.events.resizemove)
        .off('resizeend', this.events.resizeend)
        .off('doubletap', this.events.doubletap)
      })
    this.removeBodyScrollFix()
  }

  // calculates the point of [column, row] within the grid
  calcPoint (grid, cell, cors, mathFunc = 'ceil') {
    const gridRect = this.getBoundingClientRectAbsolute(grid)
    const cellRect = this.getCellRect(cell)
    const [x, y] = [cors[0] - gridRect.left, cors[1] - gridRect.top]
    return [Math[mathFunc](x / cellRect.width), Math[mathFunc](y / cellRect.height)]
  }

  // calculates the bounding rectangle of one cell within the grid (takes in account when an item spans multiple cells)
  getCellRect (cell, rect = undefined) {
    const regex = /span\s*/
    const cellRect = rect || this.getBoundingClientRectAbsolute(cell)
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
  getBoundingClientRectAbsolute (node) {
    const rect = node.getBoundingClientRect().toJSON()
    return Object.assign(rect, { top: rect.top + window.scrollY, right: rect.right + window.scrollX, bottom: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
  }

  // draw grid lines
  drawOverlayGrid (__, body, grid, cell) {
    const gridRect = this.getBoundingClientRectAbsolute(grid)
    const cellRect = this.getCellRect(cell)
    const rows = Math.round(gridRect.height / cellRect.height)
    const columns = Math.round(gridRect.width / cellRect.width)
    const additional = 5
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
                      ${!lastRow ? 'border-bottom: 1px dashed rgba(148, 0, 255, .6);' : ''}
                      ${!lastColumn ? 'border-right: 1px dashed rgba(148, 0, 255, .6);' : ''}
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

  setBodyScrollFix () {
    document.body.setAttribute('style', `${document.body.getAttribute('style') || ''}overflow: scroll;`) // avoid popping in of scroll bar
  }

  removeBodyScrollFix () {
    document.body.setAttribute('style', (document.body.getAttribute('style') || '').replace('overflow: scroll;', '')) // avoid popping in of scroll bar
  }
}
