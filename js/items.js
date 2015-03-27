"use strict"

// TODO: Support canvas scaling

var stage;

var DEFAULT_ARROW_COLOR = "red";
var DEFAULT_OBSTACLE_COLOR = "blue";
var DEFAULT_POSE_LENGTH = 100;

/**
 * items
 * This is a list of all available items
 */
var items = []


/**
 * @class Item
 * @param {createjs.Shape} object the stage representation of the obstacle
 * @param {Number} posX the x-coordinate of the position of this
 * @param {Number} posY the y-coordinate of the position of this
 */
var Item = (function() {
    function Item(object, posX, posY) {
        this.object = object || this.object;
        this.center = { x: 0, y: 0 };
        if (typeof posX !== 'undefined' &&
            typeof posY !== 'undefined') {
            this.vector = new Vector(posX, posY);
        }
        
        this.deleteButton = new createjs.Shape();
        this.deleteButton.on("click", function(event, item) {
            items.splice(items.indexOf(item), 1);
            
            stage.removeChild(item.container);
            stage.update();
        }, null, false, this);
    
        this.container = new createjs.Container();
        this.container.x = this.vector.startPos.x;
        this.container.y = this.vector.startPos.y;
        this.container.addChild(this.object);
    
        items.push(this);
        if (Mode.currentMode) {
            Mode.currentMode.enter(this);
        }
        
        stage.addChild(this.container);
        stage.update();
    }
    
    Item.prototype.show = function() {
        stage.addChild(this.container);
        stage.update();
    }
    
    Item.prototype.hide = function() {
        stage.removeChild(this.container);
        stage.update();
    }
    
    Item.remove = function(item) {
        if (items.indexOf(item) != -1) {
            items.splice(items.indexOf(item), 1);
            
            stage.removeChild(item.container);
            stage.update();
        }
    }
    
    Item.prototype.getJSONObject = function(obj, robot) {
        obj = (typeof obj === "undefined") ? {} : obj;
        
        obj.center = [ this.center.x/1000, this.center.y/1000 ];
        obj.posangle = [
            (this.vector.startPos.x - robot.translation.x)/1000,
            (robot.translation.y - this.vector.startPos.y)/1000,
            - this.vector.getAngle() * Math.PI / 180
        ];
        obj.name = items.indexOf(this) + obj.type + "_" + obj.posangle[0] + ":" + obj.posangle[1] + ":" + obj.posangle[2];
        
        
        return obj;
    }
    
    Item.prototype.setPose = function(poseObj) {
        if (typeof poseObj !== 'undefined') {
            poseObj.x = (typeof poseObj.x === 'undefined') ? this.vector.startPos.x : poseObj.x;
            poseObj.y = (typeof poseObj.y === 'undefined') ? this.vector.startPos.y : stage.height - poseObj.y;
            poseObj.rotation = (typeof poseObj.rotation === 'undefined') ? this.vector.getAngle() : - poseObj.rotation;
    
            this.vector = Vector.translate(Vector.create(this.vector.getMagnitude(), poseObj.rotation),
                                           poseObj.x, poseObj.y);
            this.update();
        }
    }
    
    Item.prototype.getPose = function() {
        return {
            x: this.vector.startPos.x,
            y: stage.height - this.vector.startPos.y,
            rotation: - this.vector.getAngle()
        }
    }
    
    Item.prototype.update = function() {
        this.deleteButton.graphics.clear().beginFill("red")
                .drawCircle(this.center.x, this.center.y, 20);
        
        this.container.x = this.vector.startPos.x;
        this.container.y = this.vector.startPos.y;
        
        stage.update();
    }
    
    Item.prototype.enableRemove = function() {
        this.update();
        
        this.container.addChild(this.deleteButton);
        stage.update();
    }
    
    Item.prototype.disableRemove = function() {
        this.container.removeChild(this.deleteButton);
        stage.update();
    }
    
    return Item;
})();

/**
 * @class Obstacle
 * @extends Item
 */
var Obstacle = (function() {
    function Obstacle(object, posX, posY) {
        Item.call(this, object, posX, posY);
        this.object.mousePlanarOffset = { x: 0, y: 0 };    
        this.object.mouseAngularOffset = 0;
        
        this.fixedVectorMagnitude = 100
        this.vector = new Vector(posX, posY, posX+object.width/2, posY, this.fixedVectorMagnitude);
    
        this.canTransform = false;
        
        this.transformButton = new createjs.Shape();
        this.transformButton.on("pressmove", function(event, item) {
            item.transform(event, 1, -1);
        }, null, false, this);
        
        this.rotateButton = new createjs.Shape();
        this.rotateButton.on("pressmove", function(event, item) {
            item.rotate(event);
        }, null, false, this);
        
        this.transformButton.graphics.clear().beginFill("black")
                .drawCircle(this.object.width/2, -this.object.height/2, 10);
        this.rotateButton.graphics.clear().beginFill("green")
                .drawCircle(0, -this.object.height/2, 10);
        
        this.update();
        
        // debug - start
    //    this.container.on("click", function(event, obstacle) {
    //        console.log(obstacle.canTransform, obstacle);
    //    }, null, false, this);
        // debug - stop
    }
    
    Obstacle.prototype = Object.create(Item.prototype);
    Obstacle.prototype.constructor = Obstacle;
    
    Obstacle.getJSON = function(robot) {
        var obstacles = [];
        items.forEach(function(item) {
            if (item instanceof Obstacle) {
                obstacles.push(item.getJSONObject({}, robot));
            }
        });
        return obstacles;
    }
    
    Obstacle.prototype.getJSONObject = function(obj, robot) {
        obj = (typeof obj === 'undefined') ? {} : obj;
        
        return Item.prototype.getJSONObject.call(this, obj, robot);
    }
    
    Obstacle.prototype.update = function(updateObj) {
        if (typeof updateObj !== 'undefined') {
            if (updateObj['startPosX'] && updateObj['startPosY']) {
                this.vector.startPos = {
                    x: updateObj.startPosX,
                    y: updateObj.startPosY
                }
            }
            if (updateObj['endPosX'] && updateObj['endPosY']) {
                this.vector.set(updateObj.endPosX, updateObj.endPosY);
            }
        }
        
        if (this.canTransform) {
            this.transformButton.graphics.clear().beginFill("black")
                    .drawCircle(this.object.width/2, -this.object.height/2, 10);
            this.rotateButton.graphics.clear().beginFill("green")
                    .drawCircle(0, -this.object.height/2, 10);
    
            this.container.rotation = this.vector.getAngle();
        }
        
        Item.prototype.update.call(this, updateObj);
    }
    
    Obstacle.prototype.rotate = function(event) {
        var rotateVector = Vector.duplicate(this.vector).set(event.stageX, event.stageY);
        
        this.vector = Vector.translate(Vector.create(this.vector.getMagnitude(), rotateVector.getAngle()+90),
                                       this.vector.startPos.x, this.vector.startPos.y);
        this.vector.fixedMagnitude = this.fixedVectorMagnitude;
        
        this.update();
    }
    
    Obstacle.prototype.transform = function(event, dX, dY) {
        var transformVector = new Vector(this.vector.startPos.x, this.vector.startPos.y,
                                         event.stageX, event.stageY);
        var denormalizedTransformVector = Vector.rotate(transformVector, -this.vector.getAngle());
    
        var extX = denormalizedTransformVector.xComp() - this.object.width/2;
        var extY = -denormalizedTransformVector.yComp() - this.object.height/2;
        
        var translateVector = new Vector(0, 0, extX, extY);
        var normalizedTranslateVector = Vector.rotate(translateVector, -this.vector.getAngle());
        
        if (this.object.width + extX > 10 && this.object.height + extY > 10) {
            this.vector = Vector.translate(this.vector,
                                           normalizedTranslateVector.xComp()*dX/2,
                                           normalizedTranslateVector.yComp()*dY/2);
            this.object.width += extX;
            this.object.height += extY;
        }
        
        this.update({ "width": this.object.width, "height": this.object.height });
    }
    
    Obstacle.prototype.addPressmove = function() {
        if (! this.object.hasEventListener("mousedown")) {
            this.mousedownListener = this.object.on("mousedown", function(event, item) {
                item.object.mousePlanarOffset = {
                    x: event.stageX-item.container.x,
                    y: event.stageY-item.container.y
                }
            }, null, false, this);
        }
    
        
        if (! this.object.hasEventListener("pressmove")) {
            this.pressmoveListener = this.object.on("pressmove", function(event, obstacle) {
                obstacle.vector = Vector.translate(obstacle.vector,
                                                   event.stageX - obstacle.vector.startPos.x - obstacle.object.mousePlanarOffset.x,
                                                   event.stageY - obstacle.vector.startPos.y - obstacle.object.mousePlanarOffset.y);
                obstacle.update();
    
                obstacle.canTransform = true;
            }, null, false, this);
        }
        
        if (! this.object.hasEventListener("pressup")) {
            this.pressupListener = this.object.on("pressup", function(event, item) {
                item.object.mousePlanarOffset = { x: 0, y: 0 };
            }, null, false, this);
        }
    }
    
    Obstacle.prototype.removePressmove = function() {
        this.object.off("mousedown", this.mousedownListener);
        this.object.off("pressmove", this.pressmoveListener);
        this.object.off("pressup", this.pressupListener);
    }
    
    Obstacle.prototype.addTransform = function() {
        this.transformListener = this.object.on("click", function(event, obstacle) {
            var canTransform = obstacle.canTransform;
            Mode.switchTo(modes["Normal"]);
            obstacle.canTransform = ! canTransform;
            
            obstacle.update();
            
            if (obstacle.canTransform) {
                obstacle.container.addChild(obstacle.transformButton);
                obstacle.container.addChild(obstacle.rotateButton);
                
                obstacle.removePressmove();            
            } else {
                obstacle.container.removeChild(obstacle.transformButton);
                obstacle.container.removeChild(obstacle.rotateButton);
                
                obstacle.addPressmove();
            }
            
            stage.update();
        }, null, false, this);
    }
    
    Obstacle.prototype.removeTransform = function() {
        this.object.off("click", this.transformListener);
        this.container.removeChild(this.rotateButton);
        this.container.removeChild(this.transformButton);
    }
    
    Obstacle.prototype.addRotate = function() {
        this.container.addChild(this.rotateButton);
    }
    
    Obstacle.prototype.removeRotate = function() {
        this.container.removeChild(this.rotateButton);
    }
    
    return Obstacle;
})();

/**
 * @class RectObstacle
 * @extends Obstacle
 * @param {Number} width the width of this
 * @param {Number} height the height of this
 * @param {String} color the display color of this
 */
var RectObstacle = (function() {
    function RectObstacle(posX, posY, width, height, color) {
        var rect = new createjs.Shape();
        rect.width = width;
        rect.height = height;
        rect.color = (typeof color === 'undefined') ? DEFAULT_OBSTACLE_COLOR : color;
        
        Obstacle.call(this, rect, posX, posY);
    }
    
    RectObstacle.prototype = Object.create(Obstacle.prototype);
    RectObstacle.prototype.constructor = RectObstacle;
    
    RectObstacle.prototype.getJSONObject = function(obj, robot) {
        obj = (typeof obj === 'undefined') ? {} : obj;
        
        obj.type = 'rect';
        obj.geomData = [ this.object.width/2000, this.object.height/2000 ];
        
        return Obstacle.prototype.getJSONObject.call(this, obj, robot);
    }
    
    RectObstacle.prototype.update = function(updateObj) {
        if (typeof updateobj !== 'undefined') {
            if (updateObj['width']) {
                this.object.width = updateObj.width;
            }
            if (updateObj['height']) {
                this.object.height = updateObj.height;
            }
        }    
    
        var width = this.object.width;
        var height = this.object.height;
        this.object.graphics.clear().beginFill(this.object.color)
                .drawRect(-width/2, -height/2, width, height);
        
        Obstacle.prototype.update.call(this, updateObj);
    }
    
    return RectObstacle;
})();

/**
 * @class EllipseObstacle
 * @extends Obstacle
 * @param {Number} width the width of this
 * @param {Number} height the height of this
 * @param {String} color the display color of this
 */
var EllipseObstacle = (function() {
    function EllipseObstacle(posX, posY, width, height, color) {
        var ellipse = new createjs.Shape();
        ellipse.width = width;
        ellipse.height = height;
        ellipse.color = (typeof color === 'undefined') ? DEFAULT_OBSTACLE_COLOR : color;
        
        Obstacle.call(this, ellipse, posX, posY);
    }
    
    EllipseObstacle.prototype = Object.create(Obstacle.prototype);
    EllipseObstacle.prototype.constructor = EllipseObstacle;
    
    EllipseObstacle.prototype.getJSONObject = function(obj, robot) {
        obj = (typeof obj === 'undefined') ? {} : obj;
        
        obj.type = 'ellipse';
        obj.geomData = [ this.object.width/1000, this.object.height/1000 ];
        
        return Obstacle.prototype.getJSONObject.call(this, obj, robot);
    }
    
    EllipseObstacle.prototype.update = function(updateObj) {
        if (typeof updateObj !== 'undefined') {
            if (updateObj['width']) {
                this.object.width = updateObj.width;
            }
            if (updateObj['height']) {
                this.object.height = updateObj.height;
                this.object.height = updateObj.height;
            }
        }
        
        var width = this.object.width;
        var height = this.object.height;
        
        this.object.graphics.clear().beginFill(this.object.color)
                .drawEllipse(-width/2, -height/2, width, height);
        
        Obstacle.prototype.update.call(this, updateObj);
    }
    
    return EllipseObstacle;
})();

/**
 * @class CircleObstacle
 * @extends EllipseObstacle
 * @param {Number} radius the radius of this
 * @param {String} color the display color of this
 */
var CircleObstacle = (function() {
    function CircleObstacle(posX, posY, radius, color) {
        EllipseObstacle.call(this, posX, posY, radius*2, radius*2, color);
        
        this.object.radius = radius;
    }
    
    CircleObstacle.prototype = Object.create(EllipseObstacle.prototype);
    CircleObstacle.prototype.constructor = CircleObstacle;
    
    CircleObstacle.prototype.getJSONObject = function(obj, robot) {
        obj = (typeof obj === 'undefined') ? {} : obj;
        
        obj.type = 'circle';
        obj.geomData = [ this.object.radius/1000 ];
        
        return Obstacle.prototype.getJSONObject.call(this, obj, robot);
    }
    
    CircleObstacle.prototype.update = function(updateObj) {
        if (typeof updateObj !== 'undefined') {
            if (updateObj['width'] && updateObj['height']) {
                updateObj['width'] = updateObj['height'] = Math.max(updateObj['width'], updateObj['height']);
                this.object.radius = updateObj['width']/2;
            }
        }
        
        EllipseObstacle.prototype.update.call(this, updateObj);
    }
    
    return CircleObstacle;
})();


/**
 * @class Arrow
 * @extends Item
 * @param {Number} startPosX the x-coordinate of the start position of this
 * @param {Number} startPosX the y-coordinate of the start position of this
 * @param {Number} endPosX the x-coordinate of the end position of this
 * @param {Number} endPosY the y-coordinate of the end position of this
 * @param {String} color the display color of this
 */
var Arrow = (function() {
    function Arrow(startPosX, startPosY, endPosX, endPosY, color) {
        endPosX = (typeof endPosX === 'undefined') ? startPosX : endPosX;
        endPosY = (typeof endPosY === 'undefined') ? startPosY : endPosY;
        this.vector = new Vector(startPosX, startPosY, endPosX, endPosY);
        this.color = (typeof color === 'undefined') ? DEFAULT_ARROW_COLOR : color;
            
        var arrow = new createjs.Container();
        
        arrow.tail = new createjs.Shape();
        arrow.addChild(arrow.tail);
    
        arrow.head = new createjs.Shape();
        arrow.addChild(arrow.head);
    
        Item.call(this, arrow);
        
        this.update();
    }
    
    Arrow.prototype = Object.create(Item.prototype);
    Arrow.prototype.constructor = Arrow;
    
    Arrow.prototype.update = function(updateObj) {
        if (typeof updateObj !== 'undefined') {
            if (updateObj['endPosX'] && updateObj['endPosY']) {
                this.vector.set(updateObj.endPosX, updateObj.endPosY);
            }
        }
        
        var magnitude = this.vector.getMagnitude();
        
        this.center = {
            x: magnitude/2,
            y: 0
        };
        
        if (magnitude > 100) {
            this.object.tail.graphics.clear().beginFill(this.color)
                    .drawRect(0, -10, magnitude - 30, 20);
            this.object.head.graphics.clear().beginFill(this.color)
                    .drawPolyStar(magnitude - 30, 0, 30, 3, 0, 0)
        } else {
            this.object.tail.graphics.clear().beginFill(this.color)
                    .drawRect(0, -magnitude/10, magnitude*7/10, magnitude/5);
            this.object.head.graphics.clear().beginFill(this.color)
                    .drawPolyStar(magnitude*7/10, 0, magnitude*3/10, 3, 0, 0);
        }
        
        this.container.rotation = this.vector.getAngle();
        
        Item.prototype.update.call(this, updateObj);
    }
    
    return Arrow;
})();

/**
 * @class DraggableArrow
 * @extends Arrow
 */
var DraggableArrow = (function() {
    function DraggableArrow(startPosX, startPosY, endPosX, endPosY, color) {
        Arrow.call(this, startPosX, startPosY, endPosX, endPosY, color);
        
        this.object.mousePlanarOffset = { x: 0, y: 0 };
        this.object.normalizedMouseOffsetVector = new Vector(0, 0, 0, 0);
        this.object.criticalMouseVectorMagnitude = 0;
    }
    
    DraggableArrow.prototype = Object.create(Arrow.prototype);
    DraggableArrow.prototype.constructor = DraggableArrow;
    
    DraggableArrow.prototype.addPressmove = function() {
        if (! this.object.head.hasEventListener("mousedown")) {
            this.headMousedownListener = this.object.head.on("mousedown", function(event, item) {
                var mouseVector = Vector.duplicate(item.vector).set(event.stageX, event.stageY);
                var offsetVector = Vector.subtract(item.vector, mouseVector);
                item.object.normalizedMouseOffsetVector = Vector.rotate(offsetVector, -mouseVector.getAngle());
                
                var scalar = Math.max(1, 100 / item.vector.getMagnitude());
                item.object.normalizedMouseOffsetVector = Vector.scalarMultiply(item.object.normalizedMouseOffsetVector,
                                                                                scalar);
                
                item.object.criticalMouseVectorMagnitude = Vector.subtract(Vector.create(100, item.vector.getAngle()),
                                                                           offsetVector).getMagnitude();
            }, null, false, this);
        }
        
        if (! this.object.head.hasEventListener("pressmove")) {
            this.headPressmoveListener = this.object.head.on("pressmove", function(event, item) {
                var mouseVector = Vector.duplicate(item.vector).set(event.stageX, event.stageY);
                var denormalizedMouseOffsetVector = Vector.rotate(item.object.normalizedMouseOffsetVector,
                                                                  mouseVector.getAngle());
                
                var scalar = Math.min(1, mouseVector.getMagnitude() / item.object.criticalMouseVectorMagnitude);
                denormalizedMouseOffsetVector = Vector.scalarMultiply(denormalizedMouseOffsetVector, scalar);
                
                item.vector = Vector.add(mouseVector, denormalizedMouseOffsetVector);
                
                item.update();
            }, null, false, this);
        }
        
        if (! this.object.head.hasEventListener("pressup")) {
            this.headPressupListener = this.object.on("pressup", function(event, item) {
                item.object.normalizedMouseOffsetVector = new Vector(0, 0, 0, 0);
            }, null, false, this);
        }
        
        if (! this.object.tail.hasEventListener("mousedown")) {
            this.tailMousedownListener = this.object.tail.on("mousedown", function(event, item) {
                item.object.mousePlanarOffset = {
                    x: event.stageX - item.vector.startPos.x,
                    y: event.stageY - item.vector.startPos.y
                };
            }, null, false, this);
        }
        
        if (! this.object.tail.hasEventListener("pressmove")) {
            this.tailPressmoveListener = this.object.tail.on("pressmove", function(event, item) {
                item.vector = Vector.translate(item.vector,
                                               event.stageX - item.vector.startPos.x - item.object.mousePlanarOffset.x,
                                               event.stageY - item.vector.startPos.y - item.object.mousePlanarOffset.y);
                item.update();
            }, null, false, this);
        }
        
        if (! this.object.tail.hasEventListener("pressup")) {
            this.tailPressupListener = this.object.tail.on("pressup", function(event, item) {
                item.object.mousePlanarOffset = { x: 0, y: 0 };
            }, null, false, this);
        }
    }
    
    DraggableArrow.prototype.removePressmove = function() {
        this.object.head.off("mousedown", this.headPressmoveListener);
        this.object.head.off("pressmove", this.headPressmoveListener);
        this.object.head.off("pressup", this.headPressmoveListener);
        
        this.object.tail.off("mousedown", this.tailPressmovelistener);
        this.object.tail.off("pressmove", this.tailPressmovelistener);
        this.object.tail.off("pressup", this.tailPressmovelistener);
    }
    
    return DraggableArrow;
})();

/**
 * @class PoseItem
 * @extends DraggableArrow
 * @length {Number} length The display length of this
 */
var PoseItem = (function() {
    function PoseItem(startPosX, startPosY, endPosX, endPosY, length, color) {
        this.length = (typeof length === 'undefined') ? DEFAULT_POSE_LENGTH : length;
        DraggableArrow.call(this, startPosX, startPosY, endPosX, endPosY, color);
    }
    
    PoseItem.prototype = Object.create(DraggableArrow.prototype);
    PoseItem.prototype.constructor = PoseItem;
    
    PoseItem.prototype.update = function(updateObj) {
        if (typeof updateObj !== 'undefined') {
            if (updateObj['endPosX'] && updateObj['endPosY']) {
                this.vector.set(updateObj['endPosX'], updateObj['endPosY']);
                updateObj['endPosX'] = updateObj['endPosY'] = undefined;
            }
        }
        
        this.vector = Vector.translate(Vector.create(this.length, this.vector.getAngle()),
                                       this.vector.startPos.x, this.vector.startPos.y);
        Arrow.prototype.update.call(this, updateObj);
    }
    
    return PoseItem;
})();

/**
 * @class GraspItem
 * @extends Item
 * @param {Number} posX the x-coordinate of the center of mass of the polygon
 * @param {Number} posY the y-coordinate of the center of mass of the polygon
 * @param {Number} angle the angle of the grasp from the vertical
 * @param {Number} offset the offset of the grasp from the center of mass
 * @param {Number} length the length of each gripper in the grasp
 * @param {Number} width the width of the grasp
 * @param {String} color the color of the gripper in the grasp
 */
var GraspItem = (function() {
    function GraspItem(posX, posY, angle, offset, length, width, color) {
        length = (typeof length === 'undefined') ? 200 : length;
        width = (typeof width === 'undefined') ? 250 : width;
        offset = (typeof offset === 'undefined') ? 0 : offset;
        
        this.vector = Vector.translate(Vector.create(100, angle), posX, posY);
        this.length = length;
        this.offset = offset;
        this.width = width;
        
        var grasp = new createjs.Shape();
        grasp.color = (typeof color === 'undefined') ? "grey" : color; 
        Item.call(this, grasp);
        
        this.update();
    }
    
    GraspItem.prototype = Object.create(Item.prototype);
    GraspItem.prototype.constructor = GraspItem;
    
    GraspItem.prototype.update = function() {
        this.container.rotation = this.vector.getAngle();
        this.object.y = - this.offset;
        
        this.object.graphics.clear().beginFill(this.object.color)
            .drawRect(-this.width/2 - 30, -this.length/2, 30, this.length)
            .drawRect(this.width/2, -this.length/2, 30, this.length);
        Item.prototype.update.call(this);
    }
    
    return GraspItem;
})();

/**
 * @class Gripper
 * @extends Item
 * @param {Number} posX the x-coordinate of this
 * @param {Number} posY the y-coordinate of this
 * @param {Number} length the length of this
 * @param {String} color the color of this
 */
var Gripper = (function() {
    function Gripper(posX, posY, length, color) {
        this.length = (typeof length === 'undefined') ? 200 : length;
        this.vector = new Vector(posX, posY);
        
        var gripper = new createjs.Shape();
        gripper.color = (typeof color === 'undefined') ? "grey" : color;
        Item.call(this, gripper);
        
        this.object.text = new createjs.Text("Gripper Width", "bold 14px Open Sans", "black");
        this.object.text.y = -30;
        this.object.text.textAlign = "center";
        this.container.addChild(this.object.text);
        
        this.update();
    }
    
    Gripper.prototype = Object.create(Item.prototype);
    Gripper.prototype.constructor = Gripper;
    
    Gripper.prototype.update = function() {
        this.object.graphics.clear().beginFill(this.object.color)
            .drawRect(-this.length/2, -15, this.length, 30);
        Item.prototype.update.call(this);
    }
    
    return Gripper;
})();