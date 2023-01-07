// @ts-check
import { Shadow } from '../Weedshaker/event-driven-web-components-prototypes/src/Shadow.js'

/* global self */

/**
 * Defines a InteractiveGrid as a WebComponent wrapper around interact.js
 * As an organism, this component shall hold molecules and/or atoms
 *
 * @export
 * @class InteractiveGrid
 * @type {CustomElementConstructor}
 */
export default class InteractiveGrid extends Shadow() {
  static get observedAttributes () {
    return ['is-interactive']
  }

  constructor (...args) {
    super(...args)

    this.minWidth = Number(this.getAttribute('min-width')) || 10
    this.minHeight = Number(this.getAttribute('min-height')) || 100
    this.defaultZIndex = Number(this.getAttribute('default-z-index')) || 100

    this.interactPromise = new Promise(resolve => (this.interactResolve = resolve))
    this.wasInteractive = this.hasAttribute('is-interactive')

    this.setInteractiveEventListener = event => {
      if (!this.hasAttribute('is-interactive')) this.setAttribute('is-interactive', '')
      this.dispatchEvent(new CustomEvent(`${this.namespace}set-interactive`, {
        detail: {
          isInteractive: this.hasAttribute('is-interactive'),
          this: this
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.removeInteractiveEventListener = event => {
      if (this.hasAttribute('is-interactive')) this.removeAttribute('is-interactive', '')
      this.dispatchEvent(new CustomEvent(`${this.namespace}remove-interactive`, {
        detail: {
          isInteractive: this.hasAttribute('is-interactive'),
          this: this
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.addCellEventListener = event => {
      let cell, wasInteractive
      if ((wasInteractive = this._isInteractive)) this.stop()
      this.section.appendChild((cell = (event.detail && event.detail.cell) || document.createElement('div')))
      if (wasInteractive) this.start()
      if (event.detail && event.detail.style) cell.setAttribute('style', `${cell.getAttribute('style') || ''}${event.detail.style}`)
      this.dispatchEvent(new CustomEvent(`${this.namespace}add-cell`, {
        detail: {
          cell: cell,
          this: this
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    this.removeCellEventListener = event => {
      let cell
      if (event.detail && (event.detail.cell || event.detail.position)) {
        cell = this.section.childNodes[event.detail.cell
          ? Array.from(this.section.childNodes).findIndex(child => child === event.detail.cell)
          : Number(event.detail.position)
        ]
        if (cell) {
          cell.remove()
        } else {
          console.warn('InteractiveGrid could not remove your cell due to missing child in section: ', event.detail.cell || event.detail.position, this.section)
        }
      } else {
        cell = this.section.childNodes[this.section.childNodes.length - 1]
        cell.remove()
      }
      this.dispatchEvent(new CustomEvent(`${this.namespace}remove-cell`, {
        detail: {
          cell: cell,
          this: this
        },
        bubbles: true,
        cancelable: true,
        composed: true
      }))
    }
    const cleanStyleAttribute = string => string
      .replace(/transform.*?\:.*?\;\s*/g, '')
      .replace(/cursor\:.*?\;\s*/g, '')
      .replace(/class\=\".*?\"\s*/g, '')
      .replace(/\s\s/g, ' ')
      .replace(/\;\s\"/g, ';"')
    this.getInnerHTMLEventListener = event => {
      if (event.detail && typeof event.detail.resolve === 'function') {
        event.detail.resolve(cleanStyleAttribute(this.section.innerHTML))
      } else {
        console.warn('InteractiveGrid expects for the event "getInnerHTML a function on event.detail.resolve', event)
      }
    }
    this.getOuterHTMLEventListener = event => {
      if (event.detail && typeof event.detail.resolve === 'function') {
        this.section.setAttribute('style', this.sectionCSS)
        event.detail.resolve(cleanStyleAttribute(this.section.outerHTML))
        this.section.removeAttribute('style')
      } else {
        console.warn('InteractiveGrid expects for the event "getOuterHTML a function on event.detail.resolve', event)
      }
    }
    this.getHTMLCSSEventListener = event => {
      if (event.detail && typeof event.detail.resolve === 'function') {
        this.getOuterHTMLEventListener({detail: {resolve: outerHTML => {
          const div = document.createElement('div')
          div.innerHTML = outerHTML
          const section = div.children[0]
          const css = /* css */`<style>\n#grid {${section.getAttribute('style') || ''}}${Array.from(section.children).reduce((accumulator, currentValue, i) => /* css */`${accumulator}\n#grid > *:nth-child(${i + 1}) {${currentValue.getAttribute('style') || ''}}`, '')}\n</style>`
          section.removeAttribute('style')
          section.setAttribute('id', 'grid')
          Array.from(section.children).forEach(child => child.removeAttribute('style'))
          event.detail.resolve(css + '\n' + section.outerHTML)}}
        })
      } else {
        console.warn('InteractiveGrid expects for the event "getHTMLCSS a function on event.detail.resolve', event)
      }
    }
  }

  connectedCallback () {
    if (this.shouldComponentRenderCSS()) this.renderCSS()
    if (this.shouldComponentRenderHTML()) this.renderHTML()
    if (this.wasInteractive && !this.hasAttribute('is-interactive')) this.setAttribute('is-interactive', '')
    document.body.addEventListener(`${this.namespace ? `${this.namespace}-` : ''}setInteractive`, this.setInteractiveEventListener)
    document.body.addEventListener(`${this.namespace ? `${this.namespace}-` : ''}removeInteractive`, this.removeInteractiveEventListener)
    document.body.addEventListener(`${this.namespace ? `${this.namespace}-` : ''}addCell`, this.addCellEventListener)
    document.body.addEventListener(`${this.namespace ? `${this.namespace}-` : ''}removeCell`, this.removeCellEventListener)
    document.body.addEventListener(`${this.namespace ? `${this.namespace}-` : ''}getInnerHTML`, this.getInnerHTMLEventListener)
    document.body.addEventListener(`${this.namespace ? `${this.namespace}-` : ''}getOuterHTML`, this.getOuterHTMLEventListener)
    document.body.addEventListener(`${this.namespace ? `${this.namespace}-` : ''}getHTMLCSS`, this.getHTMLCSSEventListener)
  }

  disconnectedCallback () {
    this.wasInteractive = this.hasAttribute('is-interactive')
    if (this.wasInteractive) this.removeAttribute('is-interactive')
    document.body.removeEventListener(`${this.namespace ? `${this.namespace}-` : ''}setInteractive`, this.setInteractiveEventListener)
    document.body.removeEventListener(`${this.namespace ? `${this.namespace}-` : ''}removeInteractive`, this.removeInteractiveEventListener)
    document.body.removeEventListener(`${this.namespace ? `${this.namespace}-` : ''}addCell`, this.addCellEventListener)
    document.body.removeEventListener(`${this.namespace ? `${this.namespace}-` : ''}removeCell`, this.removeEventListener)
    document.body.removeEventListener(`${this.namespace ? `${this.namespace}-` : ''}getInnerHTML`, this.getInnerHTMLEventListener)
    document.body.removeEventListener(`${this.namespace ? `${this.namespace}-` : ''}getOuterHTML`, this.getOuterHTMLEventListener)
    document.body.removeEventListener(`${this.namespace ? `${this.namespace}-` : ''}getHTMLCSS`, this.getHTMLCSSEventListener)
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (name === 'is-interactive') {
      if (this.hasAttribute('is-interactive')) {
        this.start()
      } else {
        this.stop()
      }
    }
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldComponentRenderCSS () {
    return !this.root.querySelector(`:host > style[_css], ${this.tagName} > style[_css]`)
  }

  /**
   * evaluates if a render is necessary
   *
   * @return {boolean}
   */
  shouldComponentRenderHTML () {
    return !this.section
  }

  /**
   * renders css
   *
   * @return {void}
   */
  renderCSS () {
    this.sectionCSS = `display: grid; grid-auto-columns: 1fr; grid-auto-flow: dense; grid-auto-rows: minmax(${this.minHeight}px, 1fr); grid-gap: unset;`
    this.css = /* css */`
      :host > section {
        ${this.sectionCSS}
        background: var(--section-background, GhostWhite);
        border: var(--section-border, 1px solid gray);
        overflow: visible;
        width: 100%;
      }
      :host > section > * {
        background: var(--section-child-background, rgba(166, 211, 225, .4));
        box-shadow: var(--section-child-box-shadow, -3px -3px rgba(9, 9, 246, .3) inset);
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        touch-action: none;
        transition: var(--section-child-transition, background 3s ease-in);
        user-select: none;
        z-index: ${this.defaultZIndex};
      }
      :host > section > *.dragged {
        background: var(--section-child-background-dragged, rgba(242, 248, 218, .4));
      }
      :host > section > *.resized {
        background: var(--section-child-background-resized, rgba(220, 240, 200, .4));
      }
      :host > section > *.resized.dragged {
        background: var(--section-child-background-resized-dragged, rgba(218, 248, 218, .4));
      }
      :host > section > *.dragging, :host > section > *.resizing, :host > section > *.new {
        background: var(--section-child-background-resized-dragged, rgba(249, 163, 195, .4)) !important;
        transition: none;
      }
      :host > section > * * {
        pointer-events: none;
      }
      /* not is-interactive */
      :host(:not([is-interactive])) > section {
        background: transparent;
        border: 0;
        grid-gap: var(--section-grid-gap, unset);
        overflow: auto;
      }
      :host(:not([is-interactive])) > section > *, :host(:not([is-interactive])) > section > *.dragged, :host(:not([is-interactive])) > section > *.resized, :host(:not([is-interactive])) > section > *.resized.dragged {
        background: transparent;
        box-shadow: none;
        touch-action: auto;
        z-index: auto;
      }
      :host(:not([is-interactive])) > section > * * {
        pointer-events: auto;
      }
    `
  }

  /**
   * renders html
   *
   * @return {void}
   */
  renderHTML () {
    this.section = document.createElement('section')
    Array.from(this.root.children).forEach(node => {
      if (!node.getAttribute('slot') && node.tagName !== 'STYLE') this.section.appendChild(node)
    })
    this.html = this.section
  }

  /**
   * load and initialize all needed dependencies and serve it through interactResolve to interactPromise
   * the function unhooks itself { once: true }
   *
   * @return {void}
   */
  initInteract () {
    this.loadDependencies().then(([Interact, ProxifyHook, Chain, Proxify, interact]) => this.interactResolve(new Interact(new ProxifyHook(Chain(Proxify())).get(), interact, undefined, this.minWidth, this.minHeight, this.getAttribute('namespace') || '')))
    this.initInteract = () => {}
  }

  /**
   * load the dependencies once it starts
   *
   * @returns {Promise<any[]>}
   */
  loadDependencies () {
    return this.dependenciesPromise || (this.dependenciesPromise = Promise.all(
      [
        '../Classes/Model/Interact.js',
        '../Weedshaker/ProxifyJS/JavaScript/Classes/Helper/ProxifyHook.js',
        '../Weedshaker/ProxifyJS/JavaScript/Classes/Traps/Misc/Chain.js',
        '../Weedshaker/ProxifyJS/JavaScript/Classes/Handler/Proxify.js',
        '../Weedshaker/interact.js/dist/interact.js'
      ].map(href => {
        const name = href.match(/(.*\/)(.*)\..*$/)[2]
        if (name in self === true) return self[name]
        return import(href).then(module => {
          if (name in self === true) return self[name]
          if (module[name]) return module[name]
          return module.default
        })
      })
    ))
  }

  /**
   * starts interaction
   *
   * @return {void}
   */
  start () {
    if (this._isInteractive) return
    this._isInteractive = true
    this.initInteract()
    this.interactPromise.then(Interact => Interact.start(this.section))
  }

  /**
   * stops interaction
   *
   * @return {void}
   */
  stop () {
    if (!this._isInteractive) return
    this.interactPromise.then(Interact => Interact.stop(this.section))
    this._isInteractive = false
  }
}
