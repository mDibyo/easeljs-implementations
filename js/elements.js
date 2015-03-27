"use strict";

/**
 * @class Element
 * @param {Mode} controller the Mode with which this is associated
 * @param {String} id the DOM id of this
 * @param {String} value the value of this
 */
var Element = (function() {
    function Element(controller, id, value) {
        this.controller = controller;
        
        this.element = document.getElementById(id);
        if (this.element) {
            this.element.controller = this.controller;
        }
        
        this.set(value);
    }
    
    Element.prototype.set = function(newValue) {
        this.value(newValue);
    }
    
    Element.prototype.value = function(newValue) {
        if (this.element) {
            if (typeof newValue !== 'undefined') {
                this.element.value = newValue;
            }
            return this.element.value;
        }
    }
    
    return Element;
})();

/**
 * @class Button
 * @extends Element
 * @param {String} text the text to be displayed on this
 * @param {function} method the function to be executed when this is clicked
 * @param {color} the color of this
 */
var Button = (function () {
    function Button(controller, id, text, method, color) {
        Element.call(this, controller, id);        
        this.set(text, color, method);
    }
    
    Button.prototype = Object.create(Element.prototype);
    Button.prototype.constructor = Button;
    
    Button.prototype.set = function(newValue, newClassName, oldClassName, newMethod) {
        this._value(newValue);
        this._className(newClassName, oldClassName);
        this._method(newMethod);
    }
    
    Button.prototype._value = function(newText) {
        if (this.element) {
            if (typeof newText !== 'undefined') {
                this.element.innerHTML = newText;
            }
            return this.element.innerHTML;
        }
    }
    
    Button.prototype._method = function(newMethod) {
        if (this.element) {
            if (typeof newMethod !== 'undefined') {
                this.element.onclick = newMethod;
            }
            return this.element.onclick;
        }
    }
    
    Button.prototype._color = function(newColor) {
        if (this.element) {
            if (typeof newColor !== 'undefined') {
                this.element.style.backgroundColor = newColor;
            }
            return this.element.style.backgroundColor;
        }
    }
    
    Button.prototype._className = function(newClassName, oldClassName) {
        if (this.element) {
            if (typeof oldClassName !== 'undefined') {
                this.element.classList.remove(oldClassName);
            }
            if (typeof newClassName !== 'undefined') {
                this.element.classList.add(newClassName);
            }
            return this.element.className;
        }
    }
    
    return Button;
})();

/**
 * @class Input
 * @extends Element
 */
var Input = (function () {
    function Input(controller, id, value) {
        Element.call(this, controller, id, value);
    }
    
    Input.prototype = Object.create(Element.prototype);
    Input.prototype.constructor = Input;
    
    Input.prototype.enable = function() {
        if (this.element) {
            this.element.disabled = false;
        }
    }
    
    Input.prototype.disable = function() {
        if (this.element) {
            this.element.disabled = true;
        }
    }
    
    return Input;
})();

/**
 * @class Div
 * @extends Element
 */
var Div = (function () {
    function Div(controller, id, value) {
        Element.call(this, controller, id, value);
    }
    
    Div.prototype = Object.create(Element.prototype);
    Div.prototype.constructor = Div;
    
    Div.prototype.value = function(newValue) {
        if (this.element) {
            if (typeof newValue !== 'undefined') {
                this.element.innerHTML = newValue;
            }
            return this.element.innerHTML;
        }
    }
    
    return Div;
}) ();