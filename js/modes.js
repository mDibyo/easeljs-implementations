"use strict";

/**
 * modes
 * This is a dictionary of all available modes
 */
var modes = {};
var indicators = {};

/**
 * @class Mode
 * @param {String} mode the name of this
 * @param {String} buttonId the id of the Button associated with this mode
 */
var Mode = (function() {
    function Mode(mode, buttonId) {
        if (typeof buttonId !== 'undefined') {
            this.button = new Button(this, buttonId);
        }
        
        modes[mode] = this;
        
        Mode.switchTo(this);
        Mode.switchTo(Mode.previousMode);
    }
    
    Mode.previousMode = null;
    Mode.currentMode = null;
    
    Mode.switchTo = function(mode, onCompletion) {
        if (mode === 'undefined') {
            return Mode.switchTo(Mode.previousMode);
        }
        
        if (Mode.currentMode) {
            Mode.currentMode.exit();
        }
        if (mode) {
            mode.enter(onCompletion);
        }
    }
    
    Mode.prototype.enter = function() {
        Mode.currentMode = this;   
    }
    
    Mode.prototype.exit = function() {
        Mode.previousMode = this;
    }
    
    return Mode;
})();

/**
 * @class NormalMode
 * @extends Mode
 */
var NormalMode = (function() {
    function NormalMode(buttonId) {
        Mode.call(this, "Normal", buttonId);
    }
    
    NormalMode.prototype = Object.create(Mode.prototype);
    NormalMode.prototype.constructor = NormalMode;
    
    NormalMode.prototype.enter = function(item) {
        this.items = (typeof item === 'undefined') ? items : [ item ];
        
        Mode.prototype.enter.call(this);
        
        this.items.forEach(function(item) {
            if (item instanceof Obstacle) {
                item.addTransform();
                item.addPressmove();
                item.canTransform = false;
            } else if (item instanceof DraggableArrow) {
                item.addPressmove();
            }
        });
        
        if (! stage.hasEventListener("stagemouseup")) {
            this.stageClickListener = stage.on("stagemouseup", function(event) {
                if (! stage.getObjectsUnderPoint().length) {
                    Mode.switchTo(modes["Normal"]);
                }
            });
        }
        stage.update();
    }
    
    NormalMode.prototype.exit = function() {
        items.forEach(function(item) {
            if (item instanceof Obstacle) {
                item.removeTransform();
                item.removePressmove();
            } else if (item instanceof DraggableArrow) {
                item.removePressmove();
            }
        });
        
        stage.off("stagemouseup", this.stageClickListener);
        stage.update();
        
        Mode.prototype.exit.call(this);
    }
    
    return NormalMode;
})();

/**
 * @class RemoveMode
 * @extends Mode
 */
var RemoveMode = (function() {
    function RemoveMode(buttonId) {
        Mode.call(this, "Remove", buttonId);
    }
    
    RemoveMode.prototype = Object.create(Mode.prototype);
    RemoveMode.prototype.constructor = RemoveMode;
    
    RemoveMode.prototype.enter = function() {
        Mode.prototype.enter.call(this);
        
        items.forEach(function(item) {
            if (! (item instanceof PoseItem)) {
               item.enableRemove();
            }
        });
        stage.update();
        
        this.button.set("Click to stop removing", "active", "inactive", function() {
            Mode.switchTo(Mode.previousMode);
        });
    }
    
    RemoveMode.prototype.exit = function() {
        items.forEach(function(item) {
            if (! (item instanceof PoseItem)) {
                item.disableRemove();
            }
        });
        stage.update();
        
        this.button.set("Remove", "inactive", "active", function() {
            Mode.switchTo(modes["Remove"]);
        });
        
        Mode.prototype.exit.call(this);
        Mode.previousMode = modes['Normal'];
    }
    
    return RemoveMode;
})();

/**
 * @class AddRectObstacleMode
 * @extends Mode
 * @param {Number} width the width of added rectangle obstacle
 * @param {Number} height the height of added rectangle obstacle
 * @param {String} color the color of added rectangle obstacle
 */
var AddRectObstacleMode = (function(){
    function AddRectObstacleMode(buttonId, width, height, color) {
        Mode.call(this, 'AddRectObstacle', buttonId);
        
        this.obstacleWidth = (typeof width === 'undefined') ? 50 : width;
        this.obstacleHeight = (typeof height === 'undefined') ? 50 : height;
        this.obstacleColor = color;
    }
    
    AddRectObstacleMode.prototype = Object.create(Mode.prototype);
    AddRectObstacleMode.prototype.constructor = AddRectObstacleMode;
    
    AddRectObstacleMode.prototype.enter = function() {
        Mode.prototype.enter.call(this);
        
        if (!stage.hasEventListener("stagemouseup")) {
            this.stageClickListener = stage.on("stagemouseup", function(event, mode) {
                if (!stage.mouseInBounds) {
                    return;
                }
                
                mode.obstacle = new RectObstacle(event.stageX, event.stageY,
                                                 mode.obstacleWidth, mode.obstacleHeight,
                                                 mode.obstacleColor);
                
                Mode.switchTo(Mode.previousMode);
            }, null, true, this);
        }
        
        this.button.set(undefined, "active", "inactive", function() {
            Mode.switchTo(Mode.previousMode);
        });
    }
    
    AddRectObstacleMode.prototype.exit = function() {
        stage.off("stagemouseup", this.stageClickListener);
        
        this.button.set("Add Rectangular Obstacle", "inactive", "active", function() {
            Mode.switchTo(modes["AddRectObstacle"]);
        });
        
        Mode.prototype.exit.call(this);
    }
    
    return AddRectObstacleMode;
})();

/**
 * @class AddCircleObstacleMode
 * @extends Mode
 * @param {Number} radius the radius of added circle obstacle
 * @param {String} color the color of added circle obstacle
 */
var AddCircleObstacleMode = (function() {
    function AddCircleObstacleMode(buttonId, radius, color) {
        Mode.call(this, 'AddCircleObstacle', buttonId);
        
        this.obstacleRadius = (typeof radius === 'undefined') ? 50 : radius;
        this.obstacleColor = color;
    }
    
    AddCircleObstacleMode.prototype = Object.create(Mode.prototype);
    AddCircleObstacleMode.prototype.constructor = AddCircleObstacleMode;
    
    AddCircleObstacleMode.prototype.enter = function() {
        Mode.prototype.enter.call(this);
        
        if (!stage.hasEventListener("stagemouseup")) {
            this.stageClickListener = stage.on("stagemouseup", function(event, mode) {
                if (!stage.mouseInBounds) {
                    return;
                }
                
                mode.obstacle = new CircleObstacle(event.stageX, event.stageY,
                                                   mode.obstacleRadius, mode.obstacleColor);
                
                Mode.switchTo(Mode.previousMode);
            }, null, true, this);
        }
        
        this.button.set(undefined, "active", "inactive", function() {
            Mode.switchTo(Mode.previousMode);
        });
    }
    
    AddCircleObstacleMode.prototype.exit = function() {
        stage.off("stagemouseup", this.stageClickListener);
        
        this.button.set("Add Circular Obstacle", "inactive", "active", function() {
            Mode.switchTo(modes["AddCircleObstacle"]);
        });
        
        Mode.prototype.exit.call(this);
    }
    
    return AddCircleObstacleMode;
})();

/**
 * @class AddPoseMode
 * @extends Mode
 * @param {String} color the display color of created pose
 */
var AddPoseMode = (function() {
    function AddPoseMode(buttonId, color) {
        Mode.call(this, "AddPose", buttonId);
        this.poseColor = color;
    }
    
    AddPoseMode.prototype = Object.create(Mode.prototype);
    AddPoseMode.prototype.constructor = AddPoseMode;
    
    AddPoseMode.prototype.enter = function(onPose) {
        Mode.prototype.enter.call(this);
    
        if (! stage.hasEventListener("stagemousedown")) {
            this.stageClickListener = stage.on("stagemousedown", function(event, mode) {
                if (!stage.mouseInBounds) {
                    return;
                }
                
                mode.pose = new PoseItem(event.stageX, event.stageY, undefined, undefined, undefined, mode.poseColor);
                mode.pose.stageMouseoverListener = stage.on("stagemousemove", function(event, item) {
                    item.update({ endPosX: event.stageX, endPosY: event.stageY });
                }, null, false, mode.pose);
                mode.pose.clickListener = mode.pose.object.head.on("click", function(event, item) {
                    stage.off("stagemousemove", mode.pose.stageMouseoverListener);
                    stage.off("stagemouseup", item.stageClickListener);
                    
                    Mode.switchTo(Mode.previousMode);
                }, null, true, mode.pose);
                mode.pose.stageClickListener = stage.on("stagemouseup", function(event, item) {
                    if (!stage.mouseInBounds) {
                        return;
                    }
                    stage.off("stagemousemove", mode.pose.stageMouseoverListener);
                    item.object.head.off("click", item.clickListener);
                    
                    Mode.switchTo(Mode.previousMode);
                    
                    if (onPose) {
                        onPose(item);
                    }
                }, null, true, mode.pose);
            }, null, true, this);
        }
        
        this.button.set("Exit Add Pose Mode", "active", "inactive", function() {
            Mode.switchTo(Mode.previousMode);
        });
    }
    
    AddPoseMode.prototype.exit = function() {
        stage.off("stagemousedown", this.stageClickListener);
        if (stage.hasEventListener("stagemousemove")) {
            Item.remove(this.pose);
            stage.off("stagemousemove", this.pose.stageMouseoverListener);
        }
        
        this.button.set("Enter Add Pose Mode", "inactive", "active", function() {
            Mode.switchTo(modes["AddPose"]);
        });
        
        Mode.prototype.exit.call(this);
    }
    
    return AddPoseMode;
})();
