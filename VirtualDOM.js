/**
 * 
 * @file VirtualDOM.js
 * 
 * @author Henrik Hey
 * 
 * @description Creates and handles the virtual DOM
 * 
 */

class VirtualDOM {
    constructor() {};
};

/* VDOM.Compnent class */
VirtualDOM.prototype.Component = class {
    /**
     * @constructor Componenet
     * @param {!target<HTMLElement>} props 
     * document.getElementById('root');
     */
    constructor(props = undefined) {
        this.props = props;
        if(this.props.target != undefined) {
            this.$rootTarget = this.props.target;
        }else{
            this.$rootTarget = '';
        }
        this.states = {};
    };

    /**
     * @function setState
     * @param {!Object} newState 
     * @description rerenders the component based of a state change, a state being a variable with the information within the component is reliant on.
     */

    setState(newState = {}) {
        const previousView = this.render();

        for(var key in newState) {
            this.states[key] = newState[key];
        }

        const preScene  = this.preSceneMount();
        const postScene = this.postSceneMount();
        
        if(preScene['callback'] != undefined)preScene.callback();

        setTimeout(() => {
            VirtualDOM.prototype.updateElement(this.$rootTarget, this.render(), previousView);
            if(postScene['callback'] != undefined)postScene.callback();
        }, preScene['forwardDelay'] != undefined ? preScene.forwardDelay : 0);
    };

    forceUpdate() {
        const previousView = this.render();
        VirtualDOM.prototype.updateElement(this.$rootTarget, this.render(), previousView);
    };

    /**
     * @function preSceneMount
     * @param {*} validParams 
     */
    
    preSceneMount(validParams = {
        callback     : () => {},
        forwardDelay : 0,
    }) {
        return validParams;
    };
    
    postSceneMount(validParams = {
        callback : () => {},
    }) {
        return validParams;
    };

    render() {};
    
    setTarget(target) {
        this.$rootTarget = target;
    };
    
    getTarget() {
        return this.$rootTarget;
    };

};

VirtualDOM.prototype.createElement = function(type, props, ...children) {
    return {
        type, props: props || {}, children
    }
};

VirtualDOM.prototype.setBooleanProp = function($target, name, value) {
    if(value) {
        $target.setAttribute(name, value);
        $target[name] = true;
    } else {
        $target[name] = false;
    } 
};

VirtualDOM.prototype.isEventProp = function(name) {
    return /^on/.test(name);
};

VirtualDOM.prototype.extractEventName = function(name) {
    return name.slice(2).toLowerCase();
};

VirtualDOM.prototype.isCustomProp = function(name) {
    return this.isEventProp(name) || name === 'forceUpdate';
};

VirtualDOM.prototype.setProp = function($target, name, value) {
    if(this.isCustomProp(name)) {
        return;
    } else if (name === 'className') {
        $target.setAttribute('class', value);
    } else if (typeof value === 'boolean') {
      this.setBooleanProp($target, name, value);
    } else {
      $target.setAttribute(name, value);
    }
};

VirtualDOM.prototype.removeProp = function($target, name, value) {
    if (this.isCustomProp(name)) {
        return;
      } else if (name === 'className') {
        $target.removeAttribute('class');
      } else if (typeof value === 'boolean') {
        this.removeBooleanProp($target, name);
      } else {
        $target.removeAttribute(name);
      }
};

VirtualDOM.prototype.setProps = function($target, props) {
    Object.keys(props).forEach(name => {
        this.setProp($target, name, props[name]);
    });
};

VirtualDOM.prototype.removeBooleanProp = function($target, name) {
    $target.removeAttribute(name);
    $target[name] = false;
};

VirtualDOM.prototype.updateProp = function($target, name, newVal, oldVal) {
    if (!newVal) {
        this.removeProp($target, name, oldVal);
    } else if (!oldVal || newVal !== oldVal) {
        this.setProp($target, name, newVal);
    }
};

VirtualDOM.prototype.addEventListeners = function($target, props) {
    Object.keys(props).forEach(name => {
        if (this.isEventProp(name)) {
            $target.addEventListener(
                this.extractEventName(name),
                props[name]
            );
        }
    });
};

VirtualDOM.prototype.updateProps = function($target, newProps, oldProps = {}) {
    const props = Object.assign({}, newProps, oldProps);
    Object.keys(props).forEach(name => {
      this.updateProp($target, name, newProps[name], oldProps[name]);
    });
};

VirtualDOM.prototype.clearElement = function($element) {
    while ($element.firstChild) {
        $element.removeChild($element.firstChild);
    }
};

VirtualDOM.prototype.createDOMElement = function(node) {
    if (typeof node === 'string') {
        return document.createTextNode(node);
    }
    const $el = document.createElement(node.type);
    VirtualDOM.prototype.setProps($el, node.props);
    VirtualDOM.prototype.addEventListeners($el, node.props);
    node.children
        .map(VirtualDOM.prototype.createDOMElement)
        .forEach($el.appendChild.bind($el));
    return $el;
};

VirtualDOM.prototype.changed = function(node1, node2) {
    return typeof node1 !== typeof node2 ||
            typeof node1 === 'string' && node1 !== node2 ||
            node1.type !== node2.type ||
            node1.props && node1.props.forceUpdate;
}; 

VirtualDOM.prototype.updateElement = function($parent, newNode, oldNode, index = 0) {
    if (!oldNode) {
        $parent.appendChild(
            this.createDOMElement(newNode)
        );
    } else if (!newNode) {
        $parent.removeChild(
            $parent.childNodes[index]
        );
    } else if (this.changed(newNode, oldNode)) {
        $parent.replaceChild(
            this.createDOMElement(newNode),
            $parent.childNodes[index]
        );
    } else if (newNode.type) {
        this.updateProps(
            $parent.childNodes[index],
            newNode.props,
            oldNode.props
        );
        const newLength = newNode.children.length;
        const oldLength = oldNode.children.length;
        for (let i = 0; i < newLength || i < oldLength; i++) {
            this.updateElement(
                $parent.childNodes[index],
                newNode.children[i],
                oldNode.children[i],
                i
            );
        }
    }
};

const VDOM = new VirtualDOM();