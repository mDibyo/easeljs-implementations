"use strict"

var robots = [];

/**
 * @class SubComponent
 * @param {Object} configObject
 * @param {Object} [configObject.translation] the planar offset from body
 * @param {Object} [configObject.translation.x] the x offset
 * @param {Object} [configObject.translation.y] the y offset
 * @param {Number} [configObject.rotation] (in degrees) the angular offset from body
 * @param {String} [configObject.strokeColor] the border color of this
 * @param {String} [configObject.fillColor] the fill color of this
 */
var SubComponent = (function() {
    function SubComponent(configObject) {
        if (typeof configObject === 'undefined') {
            throw "configObject not defined!";
        }
        
        this.strokeColor = configObject.strokeColor || "black";
        this.fillColor = configObject.fillColor || "grey";
        
        this.vector = Vector.translate(Vector.create(100, this.rotation),
                                       configObject.translation.x,
                                       configObject.translation.y);
        
        this.container = new createjs.Container();
        this.container.x = this.vector.startPos.x;
        this.container.y = this.vector.startPos.y;
        this.container.rotation = this.vector.getAngle();    
    }
    
    return SubComponent;
})();

/**
 * @class BoxSubComponent
 * @extends SubComponent
 * @param {Object} configObject
 * @param {Object} [configObject.extent] the dimensions of this
 * @param {Number} [configObject.extent.width] the width
 * @param {Number} [configObject.extent.height] the height
 */
var RectSubComponent = (function() {
    function RectSubComponent(configObject) {
        SubComponent.call(this, configObject);
        
        var width = configObject.extent.width;
        var height = configObject.extent.height;
        
        this.body = new createjs.Shape();
        this.body.graphics.beginStroke(this.strokeColor).drawRect(-width/2, -height/2, width, height);
        this.body.graphics.beginFill(this.fillColor).drawRect(-width/2, -height/2, width, height);
        this.body.width = width;
        this.body.height = height;
        
        this.container.addChild(this.body);
    }
    
    RectSubComponent.prototype = Object.create(SubComponent.prototype);
    RectSubComponent.prototype.constructor = RectSubComponent;
    
    return RectSubComponent;
})();

/**
 * @class CylinderSubComponent
 * @extends SubComponent
 * @param {Object} configObject
 * @param {Number} [configObject.radius] the radius of this
 */
var CircleSubComponent = (function() {
    function CircleSubComponent(configObject) {
        SubComponent.call(this, configObject);
        
        this.body = new createjs.Shape();
        this.body.graphics.beginStroke(this.strokeColor).drawCircle(0, 0, configObject.radius);
        this.body.graphics.beginFill(this.fillColor).drawCircle(0, 0, configObject.radius);
        this.body.radius = configObject.radius;
        
        this.container.addChild(this.body);
    }
    
    CircleSubComponent.prototype = Object.create(SubComponent.prototype);
    CircleSubComponent.prototype.constructor = CircleSubComponent;
    
    return CircleSubComponent;
})();

/**
 * @class Body
 * @param {Object} configObject
 * @param {String} [configObject.name] the name of this
 * @param {Body} [configObject.offsetFrom] the Body from which this is offset
 * @param {Object} [configObject.translation] the planar offset from offsetFrom
 * @param {Object} [configObject.translation.x] the x offset
 * @param {Object} [configObject.translation.y] the y offset
 * @param {Number} [configObject.rotation] (in degrees) the angular offset from offsetFrom
 * @param {Array} [configObject.subComponents] the SubComponents of this
 */
var Body = (function() {
    function Body(configObject) {
        if (typeof configObject === 'undefined') {
            throw "configObject not defined!";
        }
        
        for (var key in configObject) {
            this[key] = configObject[key];
        }
        
        this.vector = Vector.translate(Vector.create(100, this.rotation),
                                       this.translation.x,
                                       this.translation.y);
        
        this.container = new createjs.Container();
        
        if (this["subComponents"])
        this.subComponents.forEach(function(subComponent) {
            if (subComponent instanceof SubComponent) {
                this.container.addChild(subComponent.container);
            }
        }, this);
        
        this.update();
    }
    
    Body.prototype.update = function() {
        this.container.x = this.vector.startPos.x;
        this.container.y = this.vector.startPos.y;
        this.container.rotation = this.vector.getAngle();
        
        stage.update();
    }
    
    return Body;
})();

/**
 * @class Joint
 * @param {Object} configObject
 * @param {String} [configObject.name] the name of this
 * @param {Array} [configObject.bodies] the Bodies connected by this
 * @param {Body} [configObject.offsetFrom] the Body from which this is offset
 * @param {Array} [configObject.limits] the movement limits of this
 */
var Joint = (function() {
    function Joint(configObject) {
        if (typeof configObject === 'undefined') {
            throw "configObject not defined!";
        }
        
        this.name = configObject.name;
        this.limits = configObject.limits;
        
        if (configObject.bodies[0] != configObject.offsetFrom) {
            this.body = configObject.bodies[0];
        } else {
            this.body = configObject.bodies[1];
        }
    }
    
    return Joint;
})();

/**
 * @class Robot
 * @param {Object} configObject
 * @param {Object} [configObject.translation] the planar offset of this on the stage
 * @param {Object} [configObject.translation.x] the x offset
 * @param {Object} [configObject.translation.y] the y offset
 * @param {Array} [configObject.bodies] the Bodies that make up this in the ascending order
 *                    of their z-index
 * @param {Array} [configObject.joints] the Joints that are present in this
 * @param {String} [configObject.activeManipulator] the active manipulator if present
 */
var Robot = (function() {
    function Robot(configObject) {
        if (typeof configObject === 'undefined') {
            throw "configObject not defined!";
        }
        
        for (var key in configObject) {
            this[key] = configObject[key];
        }
        
        this.container = new createjs.Container();
        if (typeof this.translation !== 'undefined') {
            this.container.x = this.translation.x;
            this.container.y = this.translation.y;
        }
    
        if (this["bodies"]) {
            this.bodies.forEach(function(body) {
                if (body instanceof Body) {
                    if (body["offsetFrom"]) {
                        body.offsetFrom.container.addChild(body.container);
                        body.subComponents.forEach(function(subComponent) {
                            subComponent.body.on("pressmove", function(event, item) {
                                var mousePoint = item.container.globalToLocal(event.stageX, event.stageY);
                                var mouseVector = new Vector(0, 0, mousePoint.x, mousePoint.y);
                                item.vector = Vector.translate(Vector.rotate(item.vector, mouseVector.getAngle()),
                                                               item.vector.startPos.x, item.vector.startPos.y);
                                item.update();
                            }, null, false, this);
                        }, body);
                    } else {
                        this.container.addChild(body.container);
                        body.subComponents.forEach(function(subComponent) {
                            subComponent.body.on("mousedown", function(event, item) {
                                item.mouseOffset = item.container.globalToLocal(event.stageX, event.stageY);
                            }, null, false, this);
                            subComponent.body.on("pressmove", function(event, item) {
                                item.translation.x = item.container.x = event.stageX - item.mouseOffset.x;
                                item.translation.y = item.container.y = event.stageY - item.mouseOffset.y;
                                stage.update();
                            }, null, false, this);
                            subComponent.body.on("pressup", function(event, item) {
                                item.mouseOffset = new createjs.Point(0, 0);
                            }, null, false, this);
                            this.mouseOffset = new createjs.Point(0, 0);
                        }, this);
                    }
                }
            }, this);
        }
        
        stage.addChild(this.container);
        stage.update();
    }
    
    Robot.prototype.setJointAngles = function(jointAngles) {
        if (typeof jointAngles === 'undefined') {
            jointAngles = [];
            for (var counter = 0; counter < this.joints.length; counter++) {
                jointAngles.push(0);
            }
        }
        if (this['joints']) {
            for (var index = 0; index < jointAngles.length; index++) {
                var oldVector = this.joints[index].body.vector;
                this.joints[index].body.vector = Vector.translate(Vector.create(oldVector.getMagnitude(), -jointAngles[index]),
                                                                  oldVector.startPos.x, oldVector.startPos.y);
                this.joints[index].body.update();
            }
        }
        
        return this;
    }
    
    Robot.prototype.getJointAngles = function() {
        var jointAngles = [];
        this.joints.forEach(function(joint) {
            jointAngles.push(-joint.body.vector.getAngle());
        });
        return jointAngles;
    }
    
    Robot.prototype.getPose = function(onPose, manipulator) {
        manipulator = (typeof manipulator === 'undefined') ? this.activeManipulator : manipulator;
        
        return services["kinematics/Kinematics"].forwardKinematics(manipulator, this.getJointAngles(), function(xmlHttp) {
            onPose(JSON.parse(xmlHttp.responseText)["pose"]);
        });
    }
    
    Robot.prototype.setPose = function(poseItem, manipulator) {
        manipulator = (typeof manipulator === 'undefined') ? this.activeManipulator : manipulator;
        
        var robotOffset = this.translation;
        var vector = Vector.translate(poseItem.vector, -robotOffset.x, -robotOffset.y);
        vector = Vector.translate(vector, 0, -2*vector.startPos.y);
        var angle = -vector.getAngle() * Math.PI/180;
        var pose = [[ Math.cos(angle), -Math.sin(angle), 0, vector.startPos.x/1000],
                    [ Math.sin(angle), Math.cos(angle),  0, vector.startPos.y/1000],
                    [ 0,               0,                1, 0.025                 ],
                    [ 0,               0,                0, 1                     ]];
        
        return services["kinematics/Kinematics"].inverseKinematics(manipulator, pose, function(xmlHttp) {
            if (xmlHttp.readyState == 4) {
                var joints = JSON.parse(xmlHttp.responseText)["joints"];
                if (!joints) {
                    console.log("Impossible pose");
                    return null;
                }
                for (var index = 0; index<joints.length; index++) {
                    joints[index] *= 180/Math.PI;
                }
                robots[0].setJointAngles(joints);
            }
        });
    }
    
    return Robot;
})();

/**
 * @class TriDOFRobot
 * @extends Robot
 * @param {Number} posX the x offset of this on the stage
 * @param {Number} posY the y offset of this on the stage
 */
var TriDOFRobot = (function() {
    function TriDOFRobot(posX, posY) {
        var Base = new Body({ name: "Base",
                              translation: { x: 0, y: 0 },
                              rotation: 0,
                              subComponents: [ new CircleSubComponent({ translation: { x: 0, y: 0 },
                                                                        rotation: 0,
                                                                        radius: 30 })]});
        
        var Arm0 = new Body({ name: "Arm0",
                              offsetFrom: Base,
                              translation: { x: 0, y: 0 },
                              rotation: 0,
                              subComponents: [ new RectSubComponent({ translation: { x: 80, y: 0 },
                                                                      rotation: 0,
                                                                      extent: { width: 160, height: 20 }})]});
        
        var Joint0 = new Joint({ name: "Arm0",
                                 bodies: [ Base, Arm0 ],
                                 offsetFrom: Base,
                                 limits: [ -180, 180 ]});
        
        var Arm1 = new Body({ name: "Arm1",
                              offsetFrom: Arm0,
                              translation: { x: 140, y: 0 },
                              rotation: 0,
                              subComponents: [ new RectSubComponent({ translation: { x: 80, y: 0 },
                                                                      rotation: 0,
                                                                      extent: { width: 160, height: 15 }})]});
        
        var Joint1 = new Joint({ name: "Arm1",
                                 bodies: [ Arm0, Arm1 ],
                                 offsetFrom: Arm0,
                                 limits: [ -180, 180 ]});
        
        var Arm2 = new Body({ name: "Arm2",
                              offsetFrom: Arm1,
                              translation: { x: 140, y: 0 },
                              rotation: 0,
                              subComponents: [ new RectSubComponent({ translation: { x: 60, y: 0 },
                                                                      rotation: 0,
                                                                      extent: { width: 120, height: 10 }})]});
        
        var Joint2 = new Joint({ name: "Arm2",
                                 bodies: [ Arm1, Arm2 ],
                                 offsetFrom: Arm1,
                                 limits: [ -180, 180 ]});
        
        Robot.call(this, { translation: { x: posX, y: posY },
                           bodies: [ Base, Arm0, Arm1, Arm2 ],
                           joints: [ Joint0, Joint1, Joint2 ],
                           activeManipulator: "arm" });
        robots.push(this);
    }
    
    TriDOFRobot.prototype = Object.create(Robot.prototype);
    TriDOFRobot.prototype.constructor = TriDOFRobot;
    
    return TriDOFRobot;
})();

/**
 * @class TriDOFRobotModed
 * @extends Robot
 * @param {Number} posX the x offset of this on the stage
 * @param {Number} posY the y offset of this on the stage
 */
var TriDOFRobotModed = (function() {
    function TriDOFRobotModed(posX, posY) {
        var Base = new Body({ name: "Base",
                              translation: { x: 0, y: 0 },
                              rotation: 0,
                              subComponents: [ new CircleSubComponent({ translation: { x: 0, y: 0 },
                                                                        rotation: 0,
                                                                        radius: 30 })]});
        
        var Arm0 = new Body({ name: "Arm0",
                              offsetFrom: Base,
                              translation: { x: 0, y: 0 },
                              rotation: 0,
                              subComponents: [ new RectSubComponent({ translation: { x: 70, y: 0 },
                                                                      rotation: 0,
                                                                      extent: { width: 140, height: 20 } })]});
        
        var Joint0 = new Joint({ name: "Arm0",
                                 bodies: [ Base, Arm0 ],
                                 offsetFrom: Base,
                                 limits: [ -180, 180 ]});
        
        var Arm1 = new Body({ name: "Arm1",
                              offsetFrom: Arm0,
                              translation: { x: 140, y: 0 },
                              rotation: 0,
                              subComponents: [ new RectSubComponent({ translation: { x: 70, y: 0 },
                                                                      rotation: 0,
                                                                      extent: { width: 140, height: 15 } }),
                                               new CircleSubComponent({ translation: { x: 0, y: 0 },
                                                                        rotation: 0,
                                                                        radius: 15 })]});
        
        var Joint1 = new Joint({ name: "Arm1",
                                 bodies: [ Arm0, Arm1 ],
                                 offsetFrom: Arm0,
                                 limits: [ -180, 180 ]});
        
        var Arm2 = new Body({ name: "Arm2",
                              offsetFrom: Arm1,
                              translation: { x: 140, y: 0 },
                              rotation: 0,
                              subComponents: [ new RectSubComponent({ translation: { x: 55, y: 0 },
                                                                      rotation: 0,
                                                                      extent: { width: 110, height: 10 } }),
                                               new CircleSubComponent({ translation: { x: 0, y: 0 },
                                                                        rotation: 0,
                                                                        radius: 10 }),
                                               new RectSubComponent({ translation: { x: 130, y: 20},
                                                                      rotation: 0,
                                                                      extent: { width: 40, height: 10 } }),
                                               new RectSubComponent({ translation: { x: 130, y: -20},
                                                                      rotation: 0,
                                                                      extent: { width: 40, height: 10 } }),
                                               new RectSubComponent({ translation: { x: 115, y: 0 },
                                                                      rotation: 0,
                                                                      extent: { width: 10, height: 50 } })]});
        
        var Joint2 = new Joint({ name: "Arm2",
                                 bodies: [ Arm1, Arm2 ],
                                 offsetFrom: Arm1,
                                 limits: [ -180, 180 ]});
        
        Robot.call(this, { translation: { x: posX, y: posY },
                           bodies: [ Base, Arm0, Arm1, Arm2 ],
                           joints: [ Joint0, Joint1, Joint2 ],
                           activeManipulator: "arm" });
        robots.push(this);
    }
    
    TriDOFRobotModed.prototype = Object.create(Robot.prototype);
    TriDOFRobotModed.prototype.constructor = TriDOFRobotModed;
    
    return TriDOFRobotModed;
})();



/*************************************** OLD CODE ***************************************/

var Arm = (function() {
    function Arm(width, height, vector, strokeColor, fillColor) {
        var strokeColor = strokeColor || "black";
        var fillColor = fillColor || "grey";
        this.vector = vector || new Vector(0, 0);
        
        this.body = new createjs.Shape();
        this.body.graphics.beginStroke(strokeColor).drawRect(0, 0-height/2, width, height);
        this.body.graphics.beginFill(fillColor).drawRect(0, 0-height/2, width, height);
        this.body.on("pressmove", function(event, item) {
            var mousePoint = item.container.globalToLocal(event.stageX, event.stageY);
            var mouseVector = new Vector(0, 0, mousePoint.x, mousePoint.y);
            item.vector = Vector.translate(Vector.rotate(item.vector, mouseVector.getAngle()),
                                           item.vector.startPos.x, item.vector.startPos.y);
            item.update();
        }, null, false, this);
        
        this.container = new createjs.Container();
        this.container.addChild(this.body);
    }
    
    Arm.prototype.update = function() {
        this.container.x = this.vector.startPos.x;
        this.container.y = this.vector.startPos.y;
        this.container.rotation = this.vector.getAngle();
        
        stage.update();
    }
    
    return Arm;
})();

var TriDOFRobotOld = (function() {
    function TriDOFRobotOld(posX, posY) {
        this.vector = new Vector(posX, posY);
        
        this.container = new createjs.Container();
        this.container.x = posX;
        this.container.y = posY;
        stage.addChild(this.container);
        
        this.base = new createjs.Shape();    
        this.base.graphics.beginFill('color').drawCircle(0, 0, 30);
        this.base.on("mousedown", function(event, item) {
            item.base.mouseOffset = item.base.globalToLocal(event.stageX, event.stageY);
        }, null, false, this);
        this.base.on("pressmove", function(event, item) {
            item.container.x = event.stageX - item.base.mouseOffset.x;
            item.container.y = event.stageY - item.base.mouseOffset.y;
            stage.update();
        }, null, false, this);
        this.base.on("pressup", function(event, item) {
            item.base.mouseOffset = new createjs.Point(0, 0);
        }, null, false, this);
        this.base.mouseOffset = new createjs.Point(0, 0);
        this.container.addChild(this.base);
        
        this.arm0 = new Arm(160, 20);
        this.container.addChild(this.arm0.container);
        
        this.arm1 = new Arm(160, 15);
        this.arm0.container.addChild(this.arm1.container);
        
        this.arm2 = new Arm(80, 10);
        this.arm1.container.addChild(this.arm2.container);
        
        robots.push(this);
        this.setJoints([0, 0, 0]);
    }
    
    TriDOFRobotOld.prototype.setJoints = function(jointAngles) {
        this.arm0.vector = Vector.create(160, -jointAngles[0]);
        this.arm0.update();
        
        this.arm1.vector = Vector.translate(Vector.create(160, -jointAngles[1]), 140, 0);
        this.arm1.update();
        
        this.arm2.vector = Vector.translate(Vector.create(80, -jointAngles[2]), 140, 0);
        this.arm2.update();
    }
    
    return TriDOFRobotOld;
})();