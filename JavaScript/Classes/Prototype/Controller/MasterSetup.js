/***************************************************************
 *
 *  Copyright notice
 *
 *  (c) 2018 Silvan Strübi <silvan.struebi@gmail.com>
 *
 *  All rights reserved
 ***************************************************************/

import { ProxifyHook } from 'https://cdn.jsdelivr.net/npm/@weedshaker/proxifyjs/JavaScript/Classes/Helper/ProxifyHook.js'
import { Proxify } from 'https://cdn.jsdelivr.net/npm/@weedshaker/proxifyjs/JavaScript/Classes/Handler/Proxify.js'
import { Chain } from 'https://cdn.jsdelivr.net/npm/@weedshaker/proxifyjs/JavaScript/Classes/Traps/Misc/Chain.js'
import '../../../interact.js' //'https://cdn.jsdelivr.net/npm/interactjs@*/dist/interact.js'

import Drag from '../../Model/Drag.js'

export default class MasterSetup {
    constructor() {
        this.__ = new ProxifyHook(Chain(Proxify())).get()
        if (window.interact) {
            this.interact = window.interact
        } else {
            console.error('SST: Can\'t find interact at global scope!!!')
        }
        this.Drag = new Drag(this.__, this.interact);
    }
    start(command, element) {
        if (!this[command]) return false
        return this[command](this.__(element))
    }
    end() {
        // interact.unset
    }
    drag(element) {
        this.Drag.start(element)
    }
}