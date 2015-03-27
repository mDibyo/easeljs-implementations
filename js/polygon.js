"use strict";

var stage;

var EDGE_WIDTH = 5;

/**
 * @class Vertex
 * @param {Number} posX the x-coordinate of this
 * @param {Number} posY the y-coordinate of this
 * @param {String} color the display color of this 
 */
var Vertex = (function() {
    function Vertex(posX, posY, color) {
        this.polygon = null;
        
        this.color = (typeof color === 'undefined') ? "black" : color;
        
        this.object = new createjs.Shape();
        this.object.graphics.beginFill(this.color).drawCircle(0, 0, 7.5);
        this.object.x = posX;
        this.object.y = posY;
        this.object.isMoving = false;
        
        this.object.on("mousedown", function(event, vertex) {
            vertex.object.mousePlanarOffset = {
                x: event.stageX - vertex.object.x,
                y: event.stageY - vertex.object.y
            }
        }, null, false, this);
        this.object.on("pressmove", function(event, vertex) {
            vertex.object.isMoving = true;
            
            vertex.object.x = event.stageX - vertex.object.mousePlanarOffset.x,
            vertex.object.y = event.stageY - vertex.object.mousePlanarOffset.y,
            vertex.update();
        }, null, false, this);
        this.object.on("pressup", function(event, vertex) {
            if (vertex.object.isMoving || !vertex.polygon.isComplete) {
                vertex.object.mousePlanarOffset = { x: 0, y: 0 };
            } else {
                vertex.polygon.removeVertex(vertex);
            }
            vertex.object.isMoving = false;
        }, null, false, this);
    }
    
    Vertex.prototype.update = function() {
        if (this.edge1) {
            this.edge1.update();
        }
        if (this.edge2) {
            this.edge2.update();
        }
        
        if (this.polygon) {
            this.polygon.update();
        }
        
        stage.update();
    }
    
    Vertex.prototype.toString = function() {
        return "[" + this.object.x + "," + this.object.y + "]";
    }
    
    return Vertex;
})();

/**
 * @class Edge
 * @param {Vertex} vertex1 first of pair of vertices that define this
 * @param {Vertex} vertex2 second of pair of vertices that define this
 * @param {String} color the display color of this
 */
var Edge = (function() {
    function Edge(vertex1, vertex2, color) {
        this.polygon = null;
        
        this.color = (typeof color === 'undefined') ? "red" : color;
        
        this.vertex1 = vertex1;
        vertex1.edge2 = this;
        this.vertex2 = vertex2;
        vertex2.edge1 = this;
        
        this.object = new createjs.Shape();
        this.object.graphics.setStrokeStyle(EDGE_WIDTH).beginStroke(this.color);
        
        this.update();
    }
    
    Edge.prototype.update = function() {
        this.object.graphics.clear().setStrokeStyle(EDGE_WIDTH).beginStroke(this.color)
                .moveTo(this.vertex1.object.x, this.vertex1.object.y)
                .lineTo(this.vertex2.object.x, this.vertex2.object.y);
        
        stage.update();
    }
    
    Edge.prototype.toString = function() {
        return this.vertex1.toString() + " - " + this.vertex2.toString();
    }
    
    return Edge;
})();

/**
 * @class Polygon
 * @param {Number} startPosX the x-coordinate of the first vertex of this
 * @param {Number} startPosy the y-coordinate of the first vertex of this
 * @param {String} vertexColor the display color of the vertices of this
 * @param {String} edgeColor the display color of the edges of this
 * @param {String} centroidColor the display color of the controid if this
 */
var Polygon = (function() {
    function Polygon(startPosX, startPosY, vertexColor, edgeColor, centroidColor) {
        this.vertexColor = vertexColor;
        this.edgeColor = edgeColor;
        this.centroidColor = (typeof centroidColor === 'undefined') ? 'green' : centroidColor
        
        this.vertices = [];
        this.edges = [];
        this.centroid = null;
        
        this.container = new createjs.Container();
        if (typeof startPosX !== 'undefined' && typeof startPosY !== 'undefined') {
            this._addVertex(new Vertex(startPosX, startPosY, this.vertexColor));
        }
        stage.addChild(this.container);
        
        this.centroidObject = new createjs.Shape();
        this.centroidObject.graphics.beginFill(this.centroidColor).drawCircle(0, 0, 5);
        
        // polygons.push(this);
        stage.update();
        
        this.isComplete = false;
    }
    
    Polygon.polygon = null;
    
    Polygon.reset = function() {
        if (Polygon.polygon) {
            stage.removeChild(Polygon.polygon.container);
            Polygon.polygon = null;
        }
    }
    
    Polygon.init = function(vertexColor, edgeColor, centroidColor) {
        Polygon.vertexColor = (typeof vertexColor === 'undefined') ? Polygon.vertexColor : vertexColor;
        Polygon.edgeColor = (typeof edgeColor === 'undefined') ? Polygon.edgeColor : edgeColor;
        Polygon.centroidColor = (typeof centroidColor === 'undefined') ? Polygon.centroidColor : centroidColor;
        
        Polygon.reset();
        
        if (! stage.hasEventListener("stagemouseup")) {
            Polygon.StageAddPolygonClickListener = stage.on("stagemouseup", function(event) {
                if (!stage.mouseInBounds) {
                    return;
                }
                
                stage.off("stagemouseup", Polygon.StageAddPolygonClickListener);
                Polygon.polygon = new Polygon(event.stageX, event.stageY,
                                              Polygon.vertexColor, Polygon.edgeColor, Polygon.centroidColor);
                
                Polygon.polygon.update();
            }, null, false);
        }
    }
    
    Polygon.completeListeners = [];
    Polygon.updateListeners = [];
    
    Polygon.prototype._executeListeners = function(listeners, args) {
        listeners.forEach(function(listener) {
            listener.apply(this, args);
        }, this);
    }
    
    Polygon.onComplete = function(onCompleteListener) {
        if (Polygon.completeListeners.indexOf(onCompleteListener) < 0) {
            Polygon.completeListeners.push(onCompleteListener);
        }
        return onCompleteListener;
    }
    
    Polygon.offComplete = function(onCompleteListener) {
        var index = Polygon.completeListeners.indexOf(onCompleteListener);
        if (index > -1) {
            Polygon.completeListeners.splice(index, 1);
        }
    }
    
    Polygon.onUpdate = function(onUpdateListener) {
        if (Polygon.updateListeners.indexOf(onUpdateListener) < 0) {
            Polygon.updateListeners.push(onUpdateListener);
        }
        return onUpdateListener;
    }
    
    Polygon.offUpdate = function(onUpdateListener) {
        var index = Polygon.updateListeners.indexOf(onUpdateListener);
        if (index > -1) {
            Polygon.updateListeners.splice(index, 1);
        }
    }
    
    Polygon.prototype._updateCentroid = function() {
        var numSides = this.vertices.length;
        if (numSides < 3) {
            return;
        }
        
        // calculate determinants of matrix of adjacent pairs of points
        var determinants = []
        var mat = null;
        for (var index = 0; index < numSides; index++) {
            mat = new Matrix2by2(this.vertices[index].object.x,
                                 this.vertices[index].object.y,
                                 this.vertices[(index+1)%numSides].object.x,
                                 this.vertices[(index+1)%numSides].object.y)
            determinants[index] = mat.determinant();
        }
        
        var area_signed = determinants.reduce(function(x, y) { return x+y; }) / 2;
        
        var c_x = 0;
        var c_y = 0;
        for (var index = 0; index < numSides; index++) {
            c_x += (this.vertices[index].object.x+this.vertices[(index+1)%numSides].object.x)
                    *determinants[index];
            c_y += (this.vertices[index].object.y+this.vertices[(index+1)%numSides].object.y)
                    *determinants[index];
        }
        c_x /= 6*area_signed;
        c_y /= 6*area_signed;
        
        this.centroidObject.x = c_x;
        this.centroidObject.y = c_y;
    }
    
    Polygon.prototype.resizeAndPosition = function(padding) {
        var minX = stage.width;
        var minY = stage.height;
        var maxX = 0;
        var maxY = 0;
        
        // find minX, minY, maxX, maxY
        this.vertices.forEach(function(vertex) {
            if (vertex.object.x < minX) {
                minX = vertex.object.x;
            }
            if (vertex.object.x > maxX) {
                maxX = vertex.object.x;
            }
            if (vertex.object.y < minY) {
                minY = vertex.object.y;
            }
            if (vertex.object.y > maxY) {
                maxY = vertex.object.y;
            }
        });
        
        if (minX < padding || minY < padding || maxX > stage.width-padding || maxY > stage.height-padding) {
            var scale = Math.min(1, (stage.width-2*padding)/(maxX-minX), (stage.height-2*padding)/(maxY-minY));
            this._updateCentroid();
            var centX = this.centroidObject.x;
            var centY = this.centroidObject.y;        
            
            this.vertices.forEach(function(vertex) {
                var x = vertex.object.x;
                vertex.object.x = (x-centX)*scale + stage.width/2;
                
                var y = vertex.object.y;
                vertex.object.y = (y-centY)*scale + stage.height/2;
            
                vertex.update();
            });
        }
    }
    
    Polygon.prototype._addEdge = function(edge, edgeIndex) {
        if (typeof edgeIndex === 'undefined') {
            edgeIndex = this.edges.length;
        } else if (edgeIndex > this.vertices.length) { // assymetry between edge and vertex here
            console.error("illegal edge number");
            return false
        }
        
        if (!edge) {
            return false;
        }
        
        edge.polygon = this;
        this.edges.splice(edgeIndex, 0, edge);
        this.container.addChildAt(edge.object, 0);
        stage.update();
        return edge;
    }
    
    Polygon.prototype._removeEdge = function(edgeIndex) {
        if (typeof edgeIndex === 'undefined') {
            edgeIndex = this.edges.length-1;
        } else if (edgeIndex >= this.edges.length) {
            console.error("illegal edge number");
        }
        
        var removedEdge = this.edges.splice(edgeIndex, 1)[0];
        this.container.removeChild(removedEdge.object);
        stage.update();
        return removedEdge;
    }
    
    Polygon.prototype._addVertex = function(vertex, vertexIndex) {
        if (typeof vertexIndex === 'undefined') {
            vertexIndex = this.vertices.length;
        } else if (vertexIndex > this.vertices.length) {
            console.error("illegal vertex number");
            return false;
        }
        
        if (!vertex) {
            return false;
        }
    
        vertex.polygon = this;
        this.vertices.splice(vertexIndex, 0, vertex);
        this.container.addChild(vertex.object);
        stage.update();
        return vertex;
    }
    
    Polygon.prototype._removeVertex = function(vertexIndex) {
        if (typeof vertexIndex === 'undefined') {
            vertexIndex = this.vertices.length - 1;
        } else if (vertexIndex >= this.vertices.length) {
            console.error("illegal vertex number");
            return false;
        }
        
        var removedVertex = this.vertices.splice(vertexIndex, 1)[0];
        this.container.removeChild(removedVertex.object);
        stage.update();
        return removedVertex;
    }
    
    Polygon.prototype.addSide = function(endPosX, endPosY) {
        this._addVertex(new Vertex(endPosX, endPosY, this.vertexColor));
        
        var numVertices = this.vertices.length;
        this._addEdge(new Edge(this.vertices[numVertices-2],
                               this.vertices[numVertices-1],
                               this.edgeColor));
        
        this.update();
        return this;
    }
    
    Polygon.prototype.addVertex = function(endPosX, endPosY, vertexIndex) {
        console.log(vertexIndex);
        
        var addedVertex = this._addVertex(new Vertex(endPosX, endPosY, this.vertexColor),
                                          vertexIndex);
        
        var removedEdge = this._removeEdge(vertexIndex-1);
        this._addEdge(new Edge(removedEdge.vertex1, addedVertex, this.edgeColor), vertexIndex-1);
        this._addEdge(new Edge(addedVertex, removedEdge.vertex2, this.edgeColor), vertexIndex);
        
        this.update();
        return this;
    }
    
    Polygon.prototype.removeVertex = function(vertex) {
        var vertexIndex = this.vertices.indexOf(vertex);
        console.log(vertexIndex);
        
        if (vertexIndex >= 0) {
            this._removeVertex(vertexIndex);
            
            this._removeEdge(this.edges.indexOf(vertex.edge1));
            this._removeEdge(this.edges.indexOf(vertex.edge2));
            this._addEdge(new Edge(vertex.edge1.vertex1, vertex.edge2.vertex2, this.edgeColor),
                          vertexIndex-1);
        }
        
        if (this.vertices.length < 3) {
            this.isComplete = false;
            this._removeEdge(1);
        }
        this.update();
    }
    
    Polygon.prototype.update = function() {
        this._updateCentroid();
        if (this.isComplete) {
            stage.addChild(this.centroidObject);
            
            this.vertices[0].object.off('click', this.vertex0PolygonCompleteClickListener);
            this.vertex0PolygonCompleteClickListener = null;
            
            stage.off("stagemouseup", this.stageAddSideClickListener);
            this.stageAddSideClickListener = null;
            
            stage.update();
        } else {
            stage.removeChild(this.centroidObject);
            
            if (! this.vertex0PolygonCompleteClickListener) {
                this.vertex0PolygonCompleteClickListener =
                    this.vertices[0].object.on('click', function(event, polygon) {
                        if (polygon.vertices.length > 2) {
                            polygon.complete();
                        }
                    }, null, false, this);           
            }
            
            if (! this.stageAddSideClickListener) {
                this.stageAddSideClickListener = stage.on("stagemouseup", function(event) {
                    if (stage.mouseInBounds) {
                        if (! stage.getObjectsUnderPoint().length) {
                            Polygon.polygon.addSide(event.stageX, event.stageY);
                        }
                    }
                });
            }
            stage.update();
        }
        
        this._executeListeners(Polygon.updateListeners, [this]);
    }
    
    Polygon.prototype.complete = function() {
        var that = this;
        setTimeout(function() {
            that.isComplete = true;
            that.update();
    
            that._executeListeners(Polygon.completeListeners, [that]);
        }, 50);
        this._addEdge(new Edge(this.vertices[this.vertices.length-1],
                               this.vertices[0],
                               this.edgeColor));
        
        return this;
    }
    
    Polygon.prototype.getJSONObject = function() {
        var polygon = [];
        
        for (var index = 0; index < this.vertices.length; index++) {
            polygon.push([
                this.vertices[index].object.x/100,
                (stage.height - this.vertices[index].object.y)/100
            ]);
        }
        
        return polygon;
    }
    
    Polygon.prototype.getDiameter = function() {
        var diameter = 0;
        for (var i = 0; i < this.vertices.length; i++) {
            for (var j = i+1; j < this.vertices.length; j++) {
                var distance = Math.sqrt(Math.pow(this.vertices[i].object.x - this.vertices[j].object.x, 2)
                        + Math.pow(this.vertices[i].object.y - this.vertices[j].object.y, 2));
                if (distance > diameter) {
                    diameter = distance;
                }
            }
        }
        return diameter;
    }
    
    return Polygon;
})();
