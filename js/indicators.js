"use strict";

/**
 * indicators
 * This is a dictionary of all available indicators
 */
var indicators = {};

/**
 * @class ServiceIndicator
 * @param {String} indicator the name of this
 * @param {String} buttonId the id of the button associated with this mode
 * @param {Robot} robot the robot associated with this
 */
var ServiceIndicator = (function () {
    function ServiceIndicator(indicator, buttonId, robot) {
        if (typeof buttonId !== 'undefined') {
            this.button = new Button(this, buttonId);
        }
        this.robot = robot;
        
        indicators[indicator] = this;
        
        this.hide();
    }
    
    ServiceIndicator.currentIndicator = null;
    
    ServiceIndicator.switchTo = function(indicator) {
        if (ServiceIndicator.currentIndicator) {
            ServiceIndicator.currentIndicator.hide();
        }
        
        indicator.show();
    }
    
    ServiceIndicator.prototype.show = function() {
        ServiceIndicator.currentIndicator = this;
    }
    
    ServiceIndicator.prototype.hide = function() {
        ServiceIndicator.currentIndicator = null;
    }
    
    return ServiceIndicator;
})();

/**
 * @class KinematicsServiceIndicator
 * @extends ServiceIndicator
 */
var KinematicsServiceIndicator = (function() {
    function KinematicsServiceIndicator(buttonId, robot) {
        ServiceIndicator.call(this, "Kinematics", buttonId, robot);
    }
    
    KinematicsServiceIndicator.prototype = Object.create(ServiceIndicator.prototype);
    KinematicsServiceIndicator.prototype.constructor = KinematicsServiceIndicator;
    
    KinematicsServiceIndicator.prototype.update = function() {
        var that = this;
        this.robot.getPose(function(pose) {
            if (typeof that.poseItem === 'undefined') {
                that.poseItem = new PoseItem(0, 0, undefined, undefined, undefined, "green");
                
                that.poseItem.object.on("pressup", function(event, indicator) {
                    indicator.robot.setPose(indicator.poseItem);
                }, null, false, that);
            }
            
            var robotOffset = that.robot.translation;
            that.poseItem.setPose({
                x: pose[0][3]*1000 + robotOffset.x, 
                y: pose[1][3]*1000 + stage.height - robotOffset.y,
                rotation: Math.atan2(pose[1][0], pose[0][0]) * 180 / Math.PI
            });
            
            that.poseItem.show();
        });
    }
    
    KinematicsServiceIndicator.prototype.show = function() {
        ServiceIndicator.prototype.show.call(this);
        
        this.update();
        
        var that = this;
        this.robot.bodies.forEach(function(body) {
            if (body instanceof Body) {
                body.subComponents.forEach(function(subComponent) {
                    subComponent.kinematicsPressupListener = subComponent.body.on("pressup", function() {
                        that.update();
                    });
                });
            }
        });
        
        this.button.set("Kinematics Mode", "active", "inactive", function() {
            indicators['Kinematics'].hide();
        });
        
        this.prevHelp = document.getElementById('dynamichelp').innerHTML
        document.getElementById('dynamichelp').innerHTML = 
            "In the Kinematics mode, the pose of the robot shows as a green arrow. " 
            + "You can drag the shaft of the arrow to reposition it, or drag the head to change its direction. "
            + "You can also move the arms or the circular base of the robot.";
    }
    
    KinematicsServiceIndicator.prototype.hide = function() {
        if (typeof this.poseItem !== 'undefined') {
            this.poseItem.hide();
        }
        
        var that = this;
        this.robot.bodies.forEach(function(body) {
            if (body instanceof Body) {
                body.subComponents.forEach(function(subComponent) {
                    subComponent.body.off("pressup", subComponent.kinematicsPressupListener);
                });
            }
        });
        
        this.button.set("Kinematics Mode", "inactive", "active", function() {
            ServiceIndicator.switchTo(indicators['Kinematics']);
        });
        
        ServiceIndicator.prototype.hide.call(this);
        
        if (this.prevHelp) {
            document.getElementById('dynamichelp').innerHTML = this.prevHelp;
        }
    }
    
    return KinematicsServiceIndicator;
})();

/**
 * @class TrajoptServiceIndicator
 * @extends ServiceIndicator
 */
var TrajoptServiceIndicator = (function() {
    function TrajoptServiceIndicator(buttonId, robot) {
        ServiceIndicator.call(this, "Trajopt", buttonId, robot);
    }
    
    TrajoptServiceIndicator.prototype = Object.create(ServiceIndicator.prototype);
    TrajoptServiceIndicator.prototype.constructor = TrajoptServiceIndicator;
    
    TrajoptServiceIndicator.prototype.init = function() {
        var that = this;
        
        // Start pose
        if (typeof this.startPoseItem === "undefined") {
            this.robot.getPose(function(pose) {
                that.startPoseItem = new PoseItem(0, 0, undefined, undefined, undefined, "red");
                
                var robotOffset = that.robot.translation;
                that.startPoseItem.setPose({
                    x: pose[0][3]*1000 + robotOffset.x, 
                    y: pose[1][3]*1000 + stage.height - robotOffset.y,
                    rotation: Math.atan2(pose[1][0], pose[0][0]) * 180 / Math.PI
                });
                
                that.startPoseItem.object.on("pressup", function(event, indicator) {
                    indicator.robot.setPose(indicator.startPoseItem);
                }, null, false, that);
            });
        }
        
        // Target pose
        if (typeof this.targetPoseItem === "undefined") {
            that.previousPoseColor = modes["AddPose"].poseColor;
            modes["AddPose"].poseColor = "green";
            Mode.switchTo(modes["AddPose"], function(targetPoseItem) {
                that.targetPoseItem = targetPoseItem;
                that.targetPoseItem.object.on("pressup", function(event, indicator) {
                    indicator.robot.setPose(indicator.startPoseItem);
                    indicator.update();
                }, null, false, that);
                
                that.update();
            });
        }
    }
    
    TrajoptServiceIndicator.prototype.update = function() {
        var that = this;
        
        var manipulator = this.robot.activeManipulator;
        
        var robotOffset = this.robot.translation;
        var vector = Vector.translate(this.targetPoseItem.vector, -robotOffset.x, -robotOffset.y);
        vector = Vector.translate(vector, 0, -2*vector.startPos.y);
        var angle = -vector.getAngle() * Math.PI/180;
        var pose = [[ Math.cos(angle), -Math.sin(angle), 0, vector.startPos.x/1000],
                    [ Math.sin(angle), Math.cos(angle),  0, vector.startPos.y/1000],
                    [ 0,               0,                1, 0.025                 ],
                    [ 0,               0,                0, 1                     ]];
        
        services["kinematics/Kinematics"].inverseKinematics(manipulator, pose, function(xmlHttp) {
            var jointTarget = JSON.parse(xmlHttp.responseText)["joints"];
            if (!jointTarget) {
                console.log("Impossible pose");
    //            ServiceIndicator.switchTo(indicators['Trajopt']);
            }
            
            // Trajopt
            var jointStart = that.robot.getJointAngles();
            for (var index = 0; index < jointStart.length; index++) {
                jointStart[index] *= Math.PI/180;
            }
               
            that.button.set(undefined, "busy", "active");
            services["trajopt/Trajopt"].optimize(jointStart, jointTarget, manipulator, function(xmlHttp) {
                var jointTrajectory = JSON.parse(xmlHttp.responseText)["result"];
                
                if (jointTrajectory.length) {
                    var trajIndex = 0;
                    var sICounter = setInterval(function() {
                        if (trajIndex == jointTrajectory.length) {
                            clearInterval(sICounter);
                            // ServiceIndicator.switchTo(indicators['Trajopt']);
                            return;
                        }
                        
                        var jointAngles = jointTrajectory[trajIndex];
                        for (var index = 0; index < jointAngles.length; index++) {
                            jointAngles[index] *= 180/Math.PI;
                        }
                        that.robot.setJointAngles(jointAngles);
                        trajIndex += 1;
                    }, 500/3);
                } else {
                    console.log("No collision-free trajectories");
                    return null;
                }
                
                that.button.set(undefined, "active", "busy");
            });
        });
    }
    
    TrajoptServiceIndicator.prototype.show = function() {
        ServiceIndicator.prototype.show.call(this);
        
        this.init();
        
        this.button.set("Trajopt Mode", "active", "inactive", function() {
            indicators['Trajopt'].hide();
        });
        
        this.prevHelp = document.getElementById('dynamichelp').innerHTML;
        document.getElementById('dynamichelp').innerHTML = 
            "In the Trajopt mode, you can plan a path that avoids the obstacles. "
            + "The starting pose is shown as a red arrow. " 
            + "If you want to change the start pose, drag the shaft to change the position, or drag the head to change the orientation. "
            + "Once you are satisfied with the starting pose, click and hold on the desired end position. "
            + " A green arrow will appear. Move the cursor to select the desired orientation direction, and release the mouse button.";
    }
    
    TrajoptServiceIndicator.prototype.hide = function() {
        if (typeof this.startPoseItem !== "undefined") {
            this.startPoseItem.hide();
            Item.remove(this.startPoseItem)
            this.startPoseItem = undefined;
        }
        if (typeof this.targetPoseItem !== "undefined") {
            this.targetPoseItem.hide();
            Item.remove(this.targetPoseItem)
            this.targetPoseItem = undefined;
        }    
        
        modes["AddPose"].poseColor = this.previousPoseColor;
        if (Mode.currentMode == modes["AddPose"]) {
            Mode.switchTo(Mode.previousMode);
        }
        Item.remove(modes["AddPose"].pose);
    
        this.button.set("Trajopt Mode", "inactive", "active", function() {
            ServiceIndicator.switchTo(indicators['Trajopt']);
        });
        
        if (this.prevHelp) {
            document.getElementById('dynamichelp').innerHTML = this.prevHelp;
        }
        
        ServiceIndicator.prototype.hide.call(this);
    }
    
    return TrajoptServiceIndicator;
})();
    
/**
 * @class GraspingServiceIndicator
 * @extends ServiceIndicator
 * @param {String} gripper the Gripper associated with this for displaying gripper size
 * @param {Object} interfaceIds the user interface Element ids associated with this
 * @param {String} [interfaceIds.prevButtonId] the id of the button for going to the previous grasp
 * @param {String} [interfaceIds.nextButtonId] the id of the button for going to the next grasp
 * @param {String} [interfaceIds.graspQualityDivId] the id of the div where the grasp quality is displayed
 * @param {String} [interfaceIds.graspIndexDivId] the id of the div where the index of the grasp is displayed
 * @param {String} [interfaceIds.gripperWidthInputId] the id of the input field for the gripper width
 * @param {String} [interfaceIds.nunSamplesInputId] the id of the input field for number of samples
 * @param {String} [interfaceIds.posVarianceInputId] the id of the input field for positional variance
 * @param {String} [interfaceIds.angVarianceInputId] the id of the input field for angular variance
 * @param {String} [interfaceIds.dynamicHelpDivId] the id of the div where help is displayed
 * @param {String} [interfaceIds.notificationsTextDivId] the id of the div where notifications are displayed
 */
var GraspingServiceIndicator = (function() {
    function GraspingServiceIndicator(buttonId, gripper, interfaceIds) {
        this.prevButton = new Button(this, interfaceIds.prevButtonId);
        this.nextButton = new Button(this, interfaceIds.nextButtonId);
        this.graspQualityInput = new Div(this, interfaceIds.graspQualityDivId);
        this.graspIndexDiv = new Div(this, interfaceIds.graspIndexDivId);
        this.gripperWidthInput = new Input(this, interfaceIds.gripperWidthInputId);
        this.numSamplesInput = new Input(this, interfaceIds.numSamplesInputId);
        this.posVarianceInput = new Input(this, interfaceIds.posVarianceInputId);
        this.angVarianceInput = new Input(this, interfaceIds.angVarianceInputId);
        
        this.gripper = gripper;
        
        this.dynamicHelpDiv = new Div(this, interfaceIds.dynamicHelpDivId);
        this.helpCreatePolygon = "To start, draw a polygon.";
        this.helpConfigureGrasps = "Configure the grasp analysis: change the gripper width, or adjust the pose uncertainty. When ready, click \"Analyze\"";
        this.helpGeneratingGrasps = "Now generating and analyzing grasps. This may take up to a minute.";
        this.helpViewGrasps = "To browse the grasps, click the arrow buttons. The quality displayed is the estimated probability of success under the pose uncertainty.";
    
        this.notificationsTextDiv = new Div(this, interfaceIds.notificationsTextDivId);
        
        ServiceIndicator.call(this, "Grasping", buttonId);
    }
    
    GraspingServiceIndicator.prototype = Object.create(ServiceIndicator.prototype);
    GraspingServiceIndicator.prototype.constructor = GraspingServiceIndicator;
    
    GraspingServiceIndicator.prototype.init = function() {
        var that = this;
    
        this.polygon = Polygon.polygon;
    
        if (!this.polygon || !this.polygon.isComplete) {
            console.log("no polygon to grasp");
            this.hide();
            return false;
        }
        this.polygon.resizeAndPosition(150);
        this.polygon.container.mouseEnabled = false;
        
        this.dynamicHelpDiv.set(this.helpGeneratingGrasps);
        
        if (typeof this.graspItem === 'undefined') {
            this.graspItem = new GraspItem(this.polygon.centroidObject.x, this.polygon.centroidObject.y,
                                           0, -stage.height*2);
            
            this.graspItem.width = 1.15 * this.polygon.getDiameter();
        }
        this.graspItem.length = this.gripper.length;
        
        var gripperWidth = parseFloat(this.gripperWidthInput.value()) / 100;
        this.gripperWidthInput.disable();
        
        var numSamples = parseInt(this.numSamplesInput.value());
        this.numSamplesInput.disable();
        
        var posVariance = parseFloat(this.posVarianceInput.value()) / 100;
        posVariance = (isNaN(posVariance)) ? undefined : posVariance;
        this.posVarianceInput.disable();
        
        var angVariance = parseFloat(this.angVarianceInput.value()) * Math.PI / 180;
        angVariance = (isNaN(angVariance)) ? undefined : angVariance;
        this.angVarianceInput.disable();
        
        this.notificationsTextDiv.set("&nbsp;");
        
        services["grasping/Grasping"].generateGrasps(this.polygon.getJSONObject(), gripperWidth, 5, 10, numSamples,
                                                     posVariance, angVariance, function(xmlHttp) {
    //    services["grasping/Grasping"].generateGrasps([[0,0],[5,0],[5,5],[0,5]], 5, 10, function(xmlHttp) {
            that.gripper.hide();
            
            that.grasps = JSON.parse(JSON.parse(xmlHttp.responseText)["grasps"]);
            that.grasps.sort(function(g1, g2) {
                return g2.quality - g1.quality;
            });
            that.update(0);
    
            that.button.set("Reset", "active", "busy", function() {
                indicators['Grasping'].hide();
            })
    
            that.prevButton.set(undefined, "active", "inactive", function() {
                if (that.currentGraspIndex == null) {
                    console.log("no stored grasps to display");
                    return;
                }
    
                that.update(Math.mod(that.currentGraspIndex - 1, that.grasps.length));
            });
            that.nextButton.set(undefined, "active", "inactive", function() {
                if (that.currentGraspIndex == null) {
                    console.log("no stored grasps to display");
                    return;
                }
    
                that.update(Math.mod(that.currentGraspIndex + 1, that.grasps.length));
            });
            
            that.dynamicHelpDiv.set(that.helpViewGrasps);
        }, function(xmlHttp) {
            that.hide();
            that.button.set(undefined, "inactive", "busy");
            
            var notificationText = "The Grasping service could not generate grasps because the gripper width is too small. Please increase gripper width. "
            that.notificationsTextDiv.set(notificationText);
        });
        
        return true;
    }
    
    GraspingServiceIndicator.prototype.update = function(graspIndex) {
        if (typeof this.grasps === 'undefined') {
            console.error("no stored grasps to display");
            return;
        }
        
        this.currentGraspIndex = graspIndex;
        var currentGrasp = this.grasps[this.currentGraspIndex];
        
        this.graspIndexDiv.set((this.currentGraspIndex+1) + "/" + this.grasps.length);
        this.graspQualityInput.set((currentGrasp.quality * 100).toFixed(1) + "%");
        
        this.graspItem.vector = Vector.translate(Vector.create(100, -currentGrasp.angle*180/Math.PI),
                                                 this.graspItem.vector.startPos.x,
                                                 this.graspItem.vector.startPos.y);
        this.graspItem.offset = currentGrasp.offset*100;
        this.graspItem.update();
    }
    
    GraspingServiceIndicator.prototype.show = function() {
        ServiceIndicator.prototype.show.call(this);
    
        if (!this.init()) {
            return;
        }
        
        this.button.set("Generating grasps", "busy", "inactive");
    }
    
    GraspingServiceIndicator.prototype.hide = function() {
        var that = this;
        
        if (typeof this.graspItem !== "undefined") {
    //        this.graspItem.hide();
            Item.remove(this.graspItem)
            this.graspItem = undefined;
        }
        
        this.gripper.show();
        
        this.button.set("Generate Grasps", "inactive", "active", function() {
            ServiceIndicator.switchTo(indicators['Grasping']);
        });
        this.prevButton.set(undefined, "inactive", "active", function() {});
        this.nextButton.set(undefined, "inactive", "active", function() {});
    
        this.graspIndexDiv.set("");
        this.graspQualityInput.set("N/A");
    
        this.gripperWidthInput.enable();
        this.numSamplesInput.enable();
        this.posVarianceInput.enable();
        this.angVarianceInput.enable();
        
        this.dynamicHelpDiv.set(this.helpCreatePolygon);
        
        if (this.polygon) {
            this.polygon.container.mouseEnabled = true;
        } else {
            Polygon.init();
        }
    
    //    this.polygonOnUpdateListener = function(polygon) {
    //        console.log("updated");
    //        if (polygon.isComplete) {
    //            var radius = polygon.getDiameter()/2;
    //            that.posVarianceInput.set(radius/5);
    //        } else {
    //            Polygon.offUpdate(that.polygonOnUpdateListener);
    //        }
    //    }
        this.polygonOnCompleteListener = Polygon.onComplete(function(polygon) {
            var radius = polygon.getDiameter()/2;
            that.posVarianceInput.set((radius/5).toFixed(1));
            that.angVarianceInput.set((10).toFixed(1));
            
            that.button.set(undefined, "active", "inactive");
            that.dynamicHelpDiv.set(that.helpConfigureGrasps);
        });
    
        ServiceIndicator.prototype.hide.call(this);
    }
    
    return GraspingServiceIndicator;
})();