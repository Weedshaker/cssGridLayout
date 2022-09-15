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
  constructor (...args) {
    super(...args)

    this.minSize = 100
    this.defaultZIndex = 100
  }

  connectedCallback () {
    if (this.shouldComponentRenderCSS()) this.renderCSS()
    if (this.shouldComponentRenderHTML()) this.renderHTML()
  }

  disconnectedCallback () {
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
        grid-auto-columns: minmax(${this.minSize}px, 1fr);
        grid-auto-flow: dense;
        grid-auto-rows: minmax(${this.minSize}px, 1fr);
        grid-gap: unset;
        overflow: visible;
      }
      :host > section > * {
        background-color: rgba(166, 211, 225, .6);
        box-shadow: -3px -3px rgba(9, 9, 246, .3) inset;
        box-sizing: border-box;
        touch-action: none;
        z-index: ${this.defaultZIndex};
      }
      :host > section > *.dragged {
        background-color: rgba(218, 248, 218, .6);
      }
      :host > section > *.resized {
        background-color: rgba(241, 213, 213, .6);
      }
      :host > section > *.resized.dragged {
        background-color: rgba(242, 248, 218, .6);
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
    this.section.innerHTML = /* html */`
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    `
    this.loadDependency().then(interact => {
      this.html = this.section
      this.Drag = new Drag(new ProxifyHook(Chain(Proxify())).get(), interact)
      this.Drag.start(this.section)
    })
  }

  /**
   * fetch dependency
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
        import('../Weedshaker/interact.js/dist/interact.js').then(module => resolve(self.interact))
      }
    }))
  }
}
