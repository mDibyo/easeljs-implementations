"use strict"

function onReadyDefinition() {
    Math.mod = function(a, m) {
        return ((a % m) + m) % m;
    }
}

/**
 * @class Vector
 * @param {Number} startX the x-coordinate of the start position of the vector
 * @param {Number} startY the y-coordinate of the start position of the vector
 * @param {Number} endX the x-coordinate of the end position of the vector
 * @param {Number} endY the y-coordinate of the end position of the vector
 * @param {Number} fixedMagnitude the fixed magnitude of the vector if that is the case 
 * 
 * TODO: Support canvas scaling
 */
var Vector = (function() {
    function Vector(startX, startY, endX, endY, fixedMagnitude) {
        this.startPos = { x: startX, y: startY };
        if (typeof endX !== 'undefined' && 
            typeof endY !== 'undefined') {
            this.endPos = { x: endX, y: endY };
            if (fixedMagnitude) {
                this.endPos = Vector.translate(Vector.scalarMultiply(Vector.unitVectorize(this), fixedMagnitude),
                                               this.startPos.x, this.startPos.y).endPos;
                this.fixedMagnitude = fixedMagnitude;
            }
        } else {
            this.endPos = null;
            this.fixedMagnitude = fixedMagnitude;
        }
        
    }
    
    Vector.create = function(magnitude, angle) {
        // Create a vector with the given magnitude and angle positioned at the origin
        angle = Math.PI / 180 * angle;
        var endPosX = magnitude * Math.cos(angle);
        var endPosY = magnitude * Math.sin(angle);
        return new Vector(0, 0, endPosX, endPosY);
    }
    
    Vector.duplicate = function(v) {
        return new Vector(v.startPos.x,
                          v.startPos.y,
                          v.endPos.x,
                          v.endPos.y,
                          v.fixedMagnitude);
    }
    
    Vector.unitVectorize = function(v) {
        // Returns the unit vector of given vector
        return Vector.create(1, v.getAngle());
    }
    
    Vector.add = function(v1, v2) {
        // Add two vectors
        return new Vector(v1.startPos.x + v2.startPos.x,
                          v1.startPos.y + v2.startPos.y,
                          v1.endPos.x + v2.endPos.x,
                          v1.endPos.y + v2.endPos.y);
    }
    
    Vector.subtract = function(v1, v2) {
        // Subtract two vectors
        return new Vector(v1.startPos.x - v2.startPos.x,
                          v1.startPos.y - v2.startPos.y,
                          v1.endPos.x - v2.endPos.x,
                          v1.endPos.y - v2.endPos.y);
    }
    
    Vector.scalarMultiply = function(v, scalar) {
        // Multiply a vector and a scalar
        return new Vector(v.startPos.x * scalar,
                          v.startPos.y * scalar,
                          v.endPos.x * scalar,
                          v.endPos.y * scalar);
    }
    
    Vector.dotMultiply = function(v1, v2) {
        // Give dot product of two vectors
        var cosAngle = Math.cos(v1.getAngle(v2) * Math.PI/180);
        return cosAngle * v1.getMagnitude() * v2.getMagnitude();
    }
    
    Vector.translate = function(v, offsetX, offsetY) {
        // Translate a vector by a given offset
        return new Vector(v.startPos.x + offsetX,
                          v.startPos.y + offsetY,
                          v.endPos.x + offsetX,
                          v.endPos.y + offsetY,
                          v.fixedMagnitude);
    }
    
    Vector.rotate = function(v, angle) {
        // Rotate a vector by a given angle
        return Vector.create(v.getMagnitude(), v.getAngle()+angle);
    }
    
    Vector.prototype.translateToOrigin = function(v) {
        // Return given vector translated to the origin
        this.set(this.xComp(), this.yComp());
        this.startPos = { x: 0, y: 0 };
        return this;
    }
    
    Vector.prototype.xComp = function() {
        return this.endPos.x - this.startPos.x
    }
    
    Vector.prototype.yComp = function() {
        return this.endPos.y - this.startPos.y
    }
    
    Vector.prototype.getMagnitude = function() {
        if (this.fixedMagnitude) {
            return this.fixedMagnitude;
        } else {
            return Math.sqrt(Math.pow(this.xComp(), 2) +  Math.pow(this.yComp(), 2));
        }
    }
    
    Vector.prototype.getAngle = function(baseVector) {
        if (typeof baseVector !== 'undefined') {
            return this.getAngle() - baseVector.getAngle();
        }
        
        return 180. * Math.atan2(this.yComp(), this.xComp()) / Math.PI
    }
    
    Vector.prototype.set = function(endPosX, endPosY) {
        this.endPos = { x: endPosX, y: endPosY };
        
        if (this.fixedMagnitude) {
            this.endPos = Vector.translate(Vector.create(this.fixedMagnitude, this.getAngle()),
                                           this.startPos.x, this.startPos.y).endPos;
        }
        return this;
    }
    
    Vector.prototype.compAlong = function(baseVector) {
        var unitBaseVector = Vector.unitVectorize(baseVector);
        var dotProduct = Vector.dotMultiply(unitBaseVector, this);
        return Vector.scalarMultiply(unitBaseVector, dotProduct);
    }

    Vector.prototype.compPerpendicularTo = function(baseVector) {
        return Vector.subtract(this, this.compAlong(baseVector));
    }
    
    Vector.prototype.toString = function() {
        return '[' + this.startPos.x + ', ' + this.startPos.y + '] => [' + this.endPos.x + ', ' + this.endPos.y + ']';
    }
    
    Vector.prototype.repr = function() {
        var vector = new createjs.Container();
        
        var position = new createjs.Shape();
        position.graphics.clear().beginFill("black").drawCircle(0, 0);
        vector.addChild(position);
        
        var direction = new createjs.Shape();
        direction.graphics.clear().beginFill("black").drawRect(0, -2, this.getMagnitude(), 4);
        vector.addChild(direction);
        
        vector.x = this.startPos.x;
        vector.y = this.endPos.y;
        vector.rotation = this.getAngle();
        
        return vector;
    }
    
    return Vector;
})();

/**
 * @class Matrix2by2
 * @param {Number} m_11
 * @param {Number} m_12
 * @param {Number} m_21
 * @param {Number} m_22
 */
var Matrix2by2 = (function() {
    function Matrix2by2(m_11, m_12, m_21, m_22) {
        this.m_11 = m_11;
        this.m_12 = m_12;
        this.m_21 = m_21;
        this.m_22 = m_22;
    }
    
    Matrix2by2.prototype.determinant = function() {
        return this.m_11*this.m_22 - this.m_12*this.m_21
    }
    
    return Matrix2by2;
})();

/**
 * @class Connection
 * @param {String} server the url of the server to which this is connecting
 */
var Connection = (function() {
    function Connection(server) {
        this.server = server;
    }
    
    Connection.prototype.POST = function(serviceMethod, requestObject, onReady, onError, service) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("POST", this.server + serviceMethod, true);
    
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status==200) {
                onReady(service, xmlHttp);
            } else if (xmlHttp.status==0) {
                onError(service, xmlHttp);
            }
        }
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.setRequestHeader("Accept", "application/json");
        
        xmlHttp.send(JSON.stringify(requestObject));
    }
    
    return Connection;
})();
