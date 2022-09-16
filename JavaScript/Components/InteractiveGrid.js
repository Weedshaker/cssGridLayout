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
  }

  connectedCallback () {
    if (this.shouldComponentRenderCSS()) this.renderCSS()
    if (this.shouldComponentRenderHTML()) this.renderHTML()
    if (this.wasInteractive && !this.hasAttribute('is-interactive')) this.setAttribute('is-interactive', '')
  }

  disconnectedCallback () {
    this.wasInteractive = this.hasAttribute('is-interactive')
    if (this.wasInteractive) this.removeAttribute('is-interactive')
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
        background: GhostWhite;
        border: 1px solid gray;
        display: grid;
        grid-auto-columns: 1fr; /* don't use this.minWidth, since the width is automatic to max 100vw by grids default behavior */
        grid-auto-flow: dense;
        grid-auto-rows: minmax(${this.minHeight}px, 1fr);
        grid-gap: unset;
        overflow: visible;
        width: 100%;
      }
      :host > section > * {
        background-color: rgba(166, 211, 225, .4);
        box-shadow: -3px -3px rgba(9, 9, 246, .3) inset;
        box-sizing: border-box;
        touch-action: none;
        z-index: ${this.defaultZIndex};
      }
      :host > section > *.dragged {
        background-color: rgba(218, 248, 218, .4);
      }
      :host > section > *.resized {
        background-color: rgba(241, 213, 213, .4);
      }
      :host > section > *.resized.dragged {
        background-color: rgba(242, 248, 218, .4);
      }
      :host > section > * * {
        pointer-events: none;
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
      if (!node.getAttribute('slot')) this.section.appendChild(node)
    })
    this.html = this.section
  }

  initInteract () {
    this.loadDependencies().then(([Interact, ProxifyHook, Chain, Proxify, interact]) => this.interactResolve(new Interact(new ProxifyHook(Chain(Proxify())).get(), interact, undefined, this.minWidth, this.minHeight)))
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

  start () {
    if (this._isInteractive) return
    this._isInteractive = true
    this.initInteract() // first start initialize, the function unhooks itself { once: true }
    this.interactPromise.then(Interact => Interact.start(this.section))
  }

  stop () {
    if (!this._isInteractive) return
    this.interactPromise.then(Interact => Interact.stop(this.section))
    this._isInteractive = false
  }
}