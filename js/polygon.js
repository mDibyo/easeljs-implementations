"use strict";

var stage;


var VERTEX_INNER_RADIUS = 5.5;
var VERTEX_OUTER_RADIUS = 10.5;
var EDGE_WIDTH = 5;



// Debug
var p;

/**
 * @class Vertex
 * @param posX
 * @param posY
 */
function Vertex(posX, posY) {
    this.object = new createjs.Shape();
    
    // Donut implementation
    // this.object.graphics
    //         .setStrokeStyle(VERTEX_OUTER_RADIUS - VERTEX_INNER_RADIUS)
    //         .beginStroke("black")
    //         .arc(this.x, this.y, (VERTEX_INNER_RADIUS+VERTEX_OUTER_RADIUS)/2, 0, 360);
    // this.object.alpha = 0.2;
    // 
    // this.object.hitArea = new createjs.Shape();
    // this.object.hitArea.graphics.beginFill("red").drawCircle(this.x, this.y, VERTEX_OUTER_RADIUS);
    
    this.object.graphics.beginFill("black").drawCircle(0, 0, 7.5);
    this.object.x = posX;
    this.object.y = posY;
    
    this.object.on("mousedown", function(event, vertex) {
        vertex.object.mousePlanarOffset = {
            x: event.stageX - vertex.object.x,
            y: event.stageY - vertex.object.y
        }
    }, null, false, this);
    this.object.on("pressmove", function(event, vertex) {
        vertex.object.x = event.stageX - vertex.object.mousePlanarOffset.x,
        vertex.object.y = event.stageY - vertex.object.mousePlanarOffset.y,
        vertex.update();
    }, null, false, this);
    this.object.on("pressup", function(event, vertex) {
        vertex.object.mousePlanarOffset = { x: 0, y: 0 };
    }, null, false, this);
    
    stage.update();
}
Vertex.prototype.update = function() {
    if (this.edge1) {
        this.edge1.update();
    }
    if (this.edge2) {
        this.edge2.update();
    }
    
    console.log(this.object.x, this.object.y);
    stage.update();
}

/**
 * @class Edge
 * @param {Vertex} vertex1 first of pair of vertices that define this
 * @param {Vertex} vertex2 second of pair of vertices that define this
 */
function Edge(vertex1, vertex2) {
    this.vertex1 = vertex1;
    vertex1.edge2 = this;
    this.vertex2 = vertex2;
    vertex2.edge1 = this;
    
    console.log(vertex1, vertex2);
    
    this.object = new createjs.Shape();
    this.object.graphics.setStrokeStyle(EDGE_WIDTH).beginStroke("red");
    
    this.update();
}
Edge.prototype.update = function() {
    this.object.graphics.clear().setStrokeStyle(EDGE_WIDTH).beginStroke("red")
            .moveTo(this.vertex1.object.x, this.vertex1.object.y)
            .lineTo(this.vertex2.object.x, this.vertex2.object.y);
    
    console.log("updated");
    stage.update();
}

/**
 * @class Polygon
 * @param {Number} startPosX the x-coordinate of the first vertex of this
 * @param {Number} startPosy the y-coordinate of the first vertex of this
 */
function Polygon(startPosX, startPosY) {
    this.vertices = [];
    this.edges = [];
    
    this.container = new createjs.Container()
    if (typeof startPosX !== 'undefined' && typeof startPosY !== 'undefined') {
        this._addVertex(new Vertex(startPosX, startPosY));
    }
    stage.addChild(this.container);
    
    this.vertices[0].object.on('click', function(event, polygon) {
    	polygon.complete();
    	console.log("completed");
    }, null, true, this);
 
    // polygons.push(this);
    stage.update();
}
Polygon.polygon = null;
Polygon.reset = function() {
	if (Polygon.polygon) {
		stage.removeChild(Polygon.polygon.container);
		Polygon.polygon = null;
	}
}
Polygon.init = function() {
	Polygon.reset();
	
	if (! stage.hasEventListener("stagemouseup")) {
		Polygon.StageAddPolygonClickListener = stage.on("stagemouseup", function(event) {
			if (!stage.mouseInBounds) {
				return;
			}
			
			Polygon.polygon = new Polygon(event.stageX, event.stageY);
			
			Polygon.StageAddSideClickListener = stage.on("stagemouseup", function(event) {
				if (! stage.getObjectsUnderPoint().length) {
					Polygon.polygon.addSide(event.stageX, event.stageY);
				}
			});
		}, null, true);
	}
	
}
Polygon.prototype._addEdge = function(edge, edgeIndex) {
    if (typeof edgeIndex === 'undefined') {
        edgeIndex = this.edges.length;
    } else {
        if (edgeIndex > this.vertices.length) { // assymetry between edge and vertex here
            console.log("illegal edge number");
            return false
        }
    }
    if (!edge) {
        return false;
    }
    
    this.edges[edgeIndex] = edge;
    this.container.addChildAt(edge.object, 0);
    stage.update();
    return true;
}
Polygon.prototype._addVertex = function(vertex, vertexIndex) {
    if (typeof vertexIndex === 'undefined') {
        vertexIndex = this.vertices.length;
    } else {
        if (vertexIndex > this.vertices.length) {
            console.log("illegal vertex number");
            return false;
        }
    }
    
    if (!vertex) {
        return false;
    }

    this.vertices[vertexIndex] = vertex;
    this.container.addChild(vertex.object);
    stage.update();
    return true;
}
Polygon.prototype.addSide = function(endPosX, endPosY) {
    this._addVertex(new Vertex(endPosX, endPosY));
    
    var numVertices = this.vertices.length;
    this._addEdge(new Edge(this.vertices[numVertices-2], this.vertices[numVertices-1]));
    
    return this;
}
Polygon.prototype.complete = function() {
	console.log("completed");
    this._addEdge(new Edge(this.vertices[this.vertices.length-1], this.vertices[0]));
    
    stage.off("stagemouseup", Polygon.StageAddSideClickListener);
    return this;
}

function init() {
    // Stage
    var canvas = document.getElementById('testCanvas');
    stage = new createjs.Stage(canvas);
    stage.width = canvas.width;
    stage.height = canvas.height;
    stage.mouseMoveOutside = false;
    
    Polygon.init();
    // (new Polygon(200, 200)).addSide(300, 350).addSide(275, 375); // .complete();
}
