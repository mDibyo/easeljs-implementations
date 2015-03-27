"use strict";

var raasServer = "http://brass.services:8888/"; // GCE
// var raasServer = "http://localhost:8888/"; // local
// var raasServer = "http://surgical5.cs.berkeley.edu:8888/"; // surgical5


var connection = new Connection(raasServer);

/**
 * services
 * This is a dictionary of all available services
 */
var services = {};

/**
 * @class Service
 * @param {String} serviceType the module containing a single Service subclass, or a
 *                     Service subclass in that module
 */
var Service = (function() {
    function Service(serviceType) {
        this.serviceType = serviceType;
        services[serviceType] = this;
        
        this.requestListeners = [];
        this.responseListeners = [];
    }
    
    Service.prototype.method = function(methodName, kwargs, onReady, onError) {
        var path = connection.server + "/" + this.serviceType + "/" + methodName;
        var request = {
            "url": path,
            "body": kwargs,
        }
        
        this._executeListeners(this.requestListeners, [ request ]);
        return connection.POST(this.serviceType + "/" + methodName, kwargs, function(service, xmlHttp) {
            service._executeListeners(service.responseListeners,
                                      [ request, JSON.parse(xmlHttp.responseText) ]);
            onReady(xmlHttp);
        }, function(service, xmlHttp) {
            if (onError) {
                onError(xmlHttp);
            }
        }, this);
    }
    
    Service.prototype._executeListeners = function(listeners, args) {
        listeners.forEach(function(listener) {
            listener.apply(this, args);
        }, this);
    }
    
    Service.prototype.onRequest = function(onRequestListener) {
        this.requestListeners.push(onRequestListener);
    }
    
    Service.prototype.onResponse = function(onResponseListener) {
        this.responseListeners.push(onResponseListener);
    }
    
    return Service;
})();

/**
 * @class HelloWorldService
 * @extends Service
 */
var HelloWorldService = (function() {
    function HelloWorldService() {
        Service.call(this, "raas_example/HelloWorld");
    }
    
    HelloWorldService.prototype = Object.create(Service.prototype);
    HelloWorldService.prototype.constructor = HelloWorldService;
    
    HelloWorldService.prototype.greet = function(label, onResponse, onError) {
        return Service.prototype.method.call(this, "greet", { "label": label }, onResponse, onError);
    }
    
    return HelloWorldService;
})();

/**
 * @class KinematicsService
 * @extends Service
 */
var KinematicsService = (function() {
    function KinematicsService() {
        Service.call(this, "kinematics/Kinematics");
    }
    
    KinematicsService.prototype = Object.create(Service.prototype);
    KinematicsService.prototype.constructor = KinematicsService;
    
    KinematicsService.prototype.forwardKinematics = function(manipulator, joints, onResponse, onError) {
        for (var index = 0; index < joints.length; index++) {
            joints[index] *= Math.PI/180;
        }
        
        return Service.prototype.method.call(this, "forwardKinematics", {
            "joints": joints,
            //"joints__fmt": "list",
            "manipulator": manipulator,
            "obstacles": JSON.stringify(Obstacle.getJSON(robots[0]))
        }, onResponse, onError);
    }
    
    KinematicsService.prototype.inverseKinematics = function(manipulator, pose, onResponse, onError) {
        return Service.prototype.method.call(this, "inverseKinematics", {
            "pose": pose,
            //"pose__fmt": "list",
            "manipulator": manipulator,
            "obstacles": JSON.stringify(Obstacle.getJSON(robots[0]))
        }, onResponse, onError);
    }
    
    return KinematicsService;
})();

/**
 * @class TrajoptService
 * @extends Service
 */
var TrajoptService = (function() {
    function TrajoptService() {
        Service.call(this, "trajopt/Trajopt");
    }
    
    TrajoptService.prototype = Object.create(Service.prototype);
    TrajoptService.prototype.constructor = TrajoptService;
    
    TrajoptService.prototype.optimize = function(jointStart, jointTarget, manipulator, onResponse, onError) {
        var trajoptRequest = {
            "basic_info" : {
                "n_steps" : 10,
                "manip" : manipulator, 
                "start_fixed" : true
            },
            "costs" : [{
                "type" : "joint_vel", 
                "params": { "coeffs" : [2] }
            }, {
                "type" : "collision",
                "params" : {
                    "coeffs" : [20], 
                    "dist_pen" : [0]
                },    
            }],
            "constraints" : [{
                "type" : "joint",
                "params" : { "vals" : jointTarget }
            }],
            "init_info" : {
                // "type" : "straight_line",
                // "endpoint" : jointTarget
                "type" : "stationary"
            }
        };
        var obstacles = Obstacle.getJSON(robots[0]);
        
        return Service.prototype.method.call(this, "optimize", {
            //"joint_start__fmt": "list",
            "joint_start": jointStart,
            //"joint_target__fmt": "list",
            "joint_target": jointTarget,
            "manipulator": manipulator,
            "obstacles": JSON.stringify(obstacles),
            "request": JSON.stringify(trajoptRequest),
        }, onResponse, onError);
    }
    
    return TrajoptService;
})();

/**
 * @class GraspingService
 * @extends Service
 */
var GraspingService = (function() {
    function GraspingService() {
        Service.call(this, "grasping/Grasping");
    }
    
    GraspingService.prototype = Object.create(Service.prototype);
    GraspingService.prototype.constructor = GraspingService;
    
    GraspingService.prototype.generateGrasps = function(polygon, gripperWidth, numPositions, numAngles, numSamples, 
                                                        posVariance, angVariance, onResponse, onError) {
        return Service.prototype.method.call(this, "generate_grasps", {
            "polygon_vertices": polygon,
            "gripper_width": gripperWidth,
            "num_positions": numPositions,
            "num_angles": numAngles,
            "num_samples": numSamples,
            "pos_variance": posVariance,
            "ang_variance": angVariance
        }, onResponse, onError);
    }
    
    return GraspingService;
})();
