// @ts-check
import Drag from '../Classes/Model/Drag.js'
import { ProxifyHook } from '../Weedshaker/ProxifyJS/JavaScript/Classes/Helper/ProxifyHook.js'
import { Proxify } from '../Weedshaker/ProxifyJS/JavaScript/Classes/Handler/Proxify.js'
import { Chain } from '../Weedshaker/ProxifyJS/JavaScript/Classes/Traps/Misc/Chain.js'
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

    this.minSize = Number(this.getAttribute('min-size')) || 100
    this.defaultZIndex = Number(this.getAttribute('default-z-index')) || 100
  }

  connectedCallback () {
    if (this.shouldComponentRenderCSS()) this.renderCSS()
    if (this.shouldComponentRenderHTML()) this.renderHTML()
  }

  disconnectedCallback () {
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (name === 'is-interactive') {
      console.log('is-interactive');
      // TODO: Listen to event and switch this attribute
      // this.start()
      // this.stop()
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
        grid-auto-columns: 1fr;
        grid-auto-flow: dense;
        grid-auto-rows: minmax(${this.minSize}px, 1fr);
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
    this.loadDependency().then(interact => {
      this.html = this.section
      this.Drag = new Drag(new ProxifyHook(Chain(Proxify())).get(), interact, undefined, this.minSize)
      this.start() // TODO: Start on event or attribute changed is-interactive
    })
  }

  /**
   * fetch dependencies which typically are not suitable for submodule aka. local no build, no stack delivery
   * taye/interact.js has no dist and may wont in future, which makes it require npm or jsdelivery except the full https://github.com/taye/interact.js/pull/980 is accepted. Until then the chrome fixed version is from the fork https://github.com/Weedshaker/interact.js
   *
   * @returns {Promise<{components: any}>}
   */
  loadDependency () {
    return this.dependencyPromise || (this.dependencyPromise = new Promise(resolve => {
      const isLoaded = () => 'interact' in self === true
      // needs markdown
      if (isLoaded()) {
        // @ts-ignore
        resolve(self.interact)
      } else {
        // @ts-ignore
        import('../Weedshaker/interact.js/dist/interact.js').then(module => resolve(self.interact))
      }
    }))
  }

  start () {
    this.Drag.start(this.section)
  }

  // TODO: add stop()
}
