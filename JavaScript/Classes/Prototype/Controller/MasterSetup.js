/***************************************************************
 *
 *  Copyright notice
 *
 *  (c) 2018 Silvan Strübi <silvan.struebi@gmail.com>
 *
 *  All rights reserved
 ***************************************************************/

import { ProxifyHook } from '../../../Weedshaker/ProxifyJS/JavaScript/Classes/Helper/ProxifyHook.js'
import { Proxify } from '../../../Weedshaker/ProxifyJS/JavaScript/Classes/Handler/Proxify.js'
import { Chain } from '../../../Weedshaker/ProxifyJS/JavaScript/Classes/Traps/Misc/Chain.js'
import '../../../Weedshaker/interact.js/dist/interact.js' //'https://cdn.jsdelivr.net/npm/interactjs@*/dist/interact.js'

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