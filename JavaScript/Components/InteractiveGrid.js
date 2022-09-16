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

    this.addCellEventListener = event => {
      let child
      this.section.appendChild((child = event.detail && event.detail.cell || document.createElement('div')))
      if (event.detail && event.detail.style) child.setAttribute('style', `${child.getAttribute('style') || ''}${event.detail.style}`)
    }
    this.removeCellEventListener = event => {
      if (event.detail && event.detail.cell) {
        const cell = this.section.childNodes[Array.from(this.section.childNodes).findIndex(child => child === event.detail.cell)]
        if (cell) {
          cell.remove()
        } else {
          console.warn('InteractiveGrid could not remove your cell due to missing child in section: ', event.detail.cell, this.section)
        }
      } else {
        this.section.childNodes[this.section.childNodes.length - 1].remove()
      }
    }
  }

  connectedCallback () {
    if (this.shouldComponentRenderCSS()) this.renderCSS()
    if (this.shouldComponentRenderHTML()) this.renderHTML()
    if (this.wasInteractive && !this.hasAttribute('is-interactive')) this.setAttribute('is-interactive', '')
    document.body.addEventListener(`${this.namespace ? `${this.namespace}-` : ''}addCell`, this.addCellEventListener)
    document.body.addEventListener(`${this.namespace ? `${this.namespace}-` : ''}removeCell`, this.removeCellEventListener)
  }

  disconnectedCallback () {
    this.wasInteractive = this.hasAttribute('is-interactive')
    if (this.wasInteractive) this.removeAttribute('is-interactive')
    document.body.removeEventListener(`${this.namespace ? `${this.namespace}-` : ''}addCell`, this.addCellEventListener)
    document.body.removeEventListener(`${this.namespace ? `${this.namespace}-` : ''}removeCell`, this.removeEventListener)
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
    this.css = /* css */`
      :host > section {
        background: var(--section-background, GhostWhite);
        border: var(--section-border, 1px solid gray);
        display: grid;
        grid-auto-columns: 1fr; /* don't use this.minWidth, since the width is automatic to max 100vw by grids default behavior */
        grid-auto-flow: dense;
        grid-auto-rows: minmax(${this.minHeight}px, 1fr);
        grid-gap: unset;
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
        transition: var(--section-child-transition, background 6s ease-in);
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
