"use strict";

function kinematicsSetup() {
    onReadyDefinition();
    kinematicsInitialize();
    kinematicsSandbox();
}

function kinematicsSandbox() {
    services["raas_example/HelloWorld"].greet("world", function(xmlHttp) {
        var greeting = JSON.parse(xmlHttp.responseText)["result"];
        console.log(greeting);
    });
    
    services["kinematics/Kinematics"].onRequest(function(request) {

        var notificationText = "Sending a request to the ";
        var requestStr = "<span class=\"data-header\">Request:</span> <br>";
        requestStr += "{ <br>";
        if (request.body.pose) {
            notificationText += "<tt>inverseKinematics</tt>"
            var pose = [];
            for (var i=0; i<4; i++) {
                    pose[i] = request.body.pose[i].slice();
                for (var j=0; j<4; j++) {
                    pose[i][j] = pose[i][j].toFixed(2);
                }
            }
            //requestStr += '  "pose__fmt": "' + request.body.pose__fmt + '", <br>';
            requestStr += '  "pose": [ [' + pose[0][0] + ", " + pose[0][1] + ", " + pose[0][2] + ", " + pose[0][3] + "], <br>";
            requestStr += '            [' + pose[1][0] + ", " + pose[1][1] + ", " + pose[1][2] + ", " + pose[1][3] + "], <br>";
            requestStr += '            [' + pose[2][0] + ", " + pose[2][1] + ", " + pose[2][2] + ", " + pose[2][3] + "], <br>";
            requestStr += '            [' + pose[3][0] + ", " + pose[3][1] + ", " + pose[3][2] + ", " + pose[3][3] + "] ], <br>";
        } else if (request.body.joints) {
            notificationText += "<tt>forwardKinematics</tt>";
            var joints = request.body.joints.slice();
            for (var i=0; i<3; i++) {
                joints[i] = joints[i].toFixed(2);
            }
            //requestStr += '  "joints__fmt": "' + request.body.joints__fmt + '", <br>';
            requestStr += '  "joints": [' + joints[0] + ", " + joints[1] + ", " + joints[2] + "] <br>";
            
        }
        notificationText += " method of the <tt>example/Kinematics</tt> service."
        requestStr += "}";
        document.getElementById('request').innerHTML = requestStr.split(" ").join("&nbsp;");
        document.getElementById('notificationstextKinematics').innerHTML = notificationText;
        document.getElementById('notificationsdetails').style.display="inline";
    });
    
    services["kinematics/Kinematics"].onResponse(function(request, response) {
        var forTrajopt = (ServiceIndicator.currentIndicator == indicators["Trajopt"]);
        var notificationText = "Called the ";
        var responseStr = "<span class=\"data-header\">Response:</span> <br>";
        responseStr += "{ <br>";
        if (response.pose) {
            notificationText += "<tt>forwardKinematics</tt>";
            notificationText += " method of the <tt>example/Kinematics</tt> service";
            if (forTrajopt) {
                notificationText += " to figure out the joint angles for the requested target end effector pose. ";
            }
            var pose = response.pose;
            for (var i=0; i<4; i++) {
                for (var j=0; j<4; j++) {
                    pose[i][j] = pose[i][j].toFixed(2);
                }
            }
            responseStr += '  "pose": [ [' + pose[0][0] + ", " + pose[0][1] + ", " + pose[0][2] + ", " + pose[0][3] + "], <br>";
            responseStr += '            [' + pose[1][0] + ", " + pose[1][1] + ", " + pose[1][2] + ", " + pose[1][3] + "], <br>";
            responseStr += '            [' + pose[2][0] + ", " + pose[2][1] + ", " + pose[2][2] + ", " + pose[2][3] + "], <br>";
            responseStr += '            [' + pose[3][0] + ", " + pose[3][1] + ", " + pose[3][2] + ", " + pose[3][3] + "] ] <br>";
        } else if (response.joints) {
            notificationText += "<tt>inverseKinematics</tt>";
            notificationText += " method of the <tt>example/Kinematics</tt> service";
            var joints = response.joints;
            for (var i=0; i<3; i++) {
                joints[i] = joints[i].toFixed(2);
            }
            responseStr += '  "joints": [' + joints[0] + ", " + joints[1] + ", " + joints[2] + "] <br>";
        } else {
            notificationText += "<tt>inverseKinematics</tt>";
            notificationText += " method of the <tt>example/Kinematics</tt> service";
            if (forTrajopt) {
                notificationText += " to figure out the joint angles for the requested target end effector pose";
            }
            notificationText += ", but the requested <tt>pose</tt> was invalid. ";
            notificationText += "Please reposition the pose so that it is reachable by the robot.";
        }
        responseStr += "}";
        
        document.getElementById('response').innerHTML = responseStr.split(" ").join("&nbsp;");
        document.getElementById('notificationstextKinematics').innerHTML = notificationText;
        document.getElementById('notificationsdetails').style.display="inline";
    });
    
    services["trajopt/Trajopt"].onRequest(function(request) {
        var requestStr = "<span class=\"data-header\">Request:</span> <br>";

        
        var joint_start = request.body.joint_start.slice();
        for (var i=0; i<3; i++) {
            joint_start[i] = joint_start[i].toFixed(2);
        }
        //requestStr += '  "joint_start__fmt": "' + request.body.joint_start__fmt + '", <br>';
        requestStr += '{<br>"joint_start":' + joint_start[0] + ', ' + joint_start[1] + ', ' + joint_start[2] + ',<br>';
        

        var joint_target = request.body.joint_target.slice();
        for (var i=0; i<3; i++) {
            joint_target[i] = joint_target[i].toFixed(2);
        }
        var newObstacles = [];
        var obstacles = [];
 
        obstacles = request.body.obstacles;
        obstacles = obstacles.split(/[\s,":]/);
        
        for (var i=0; i < obstacles.length; i++){
            if (obstacles[i]==":"){
                obstacles.splice(i,1);             
            }
        }
        for (var i=0; i < obstacles.length; i++){
            if (obstacles[i] == "[{"){
                obstacles.splice(i,1);             
            }
        }
        for (var i=0; i < obstacles.length; i++){
            if (obstacles[i] == "}]"){
                obstacles.splice(i,1);             
            }
        }
        for (var i=0; i < obstacles.length; i++){
            if (obstacles[i] == "{"){
                obstacles.splice(i,1);             
            }
        }
        for (var i=0; i < obstacles.length; i++){
            if (obstacles[i] == "}"){
                obstacles.splice(i,1);             
            }
        }
        for (var i=0; i < obstacles.length; i++){
            if (obstacles[i] == "type"){
                obstacles.splice(i,1);             
            }
        }
        for (var i=0; i < obstacles.length; i++){
            if (obstacles[i] == "") {   
                      
            }
            else {
                newObstacles.push(obstacles[i]);
            }
        }


        var circle = [];
        var rectangle = [];

        for (i=0; i < newObstacles.length; i++) {
            var x = 0;
            var y = 0;
            if (newObstacles[i]=="circle"){
                circle[x]=[newObstacles[i+2],newObstacles[i+4], newObstacles[i+5], newObstacles[i+7], newObstacles[i+8], newObstacles[i+9],newObstacles[i+11],newObstacles[i+12],newObstacles[i+13]];
                x=x+1;
            }   
            else if (newObstacles[i]=="rect"){
                rectangle[y]=[newObstacles[i+2],newObstacles[i+3], newObstacles[i+5], newObstacles[i+6], newObstacles[i+8],newObstacles[i+9], newObstacles[i+10], newObstacles[i+12], newObstacles[i+13], newObstacles[i+14]];
                y=y+1;
            }  
        }

        var myrequest = [];
        var myrequestlist=[];
        var mynewrequestlist=[];

        myrequest = request.body.request;
        myrequest = myrequest.split(/[\s,":}{]/);
        


        for (var i=0; i < myrequest.length; i++){
            if (myrequest[i]==":"){
                myrequest.splice(i,1);             
            }
        }
        for (var i=0; i < myrequest.length; i++){
            if (myrequest[i] == "[{"){
                myrequest.splice(i,1);             
            }
        }
        for (var i=0; i < myrequest.length; i++){
            if (myrequest[i] == "}]"){
                myrequest.splice(i,1);             
            }
        }
        for (var i=0; i < myrequest.length; i++){
            if (myrequest[i] == "{"){
                myrequest.splice(i,1);             
            }
        }
        for (var i=0; i < myrequest.length; i++){
            if (myrequest[i] == "}"){
                myrequest.splice(i,1);             
            }
        }
        for (var i=0; i < myrequest.length; i++){
            if (myrequest[i] == "]"){
                myrequest.splice(i,1);             
            }
        }
        for (var i=0; i < myrequest.length; i++){
            if (myrequest[i] == "["){
                myrequest.splice(i,1);             
            }
        }
        for (var i=0; i < myrequest.length; i++){
            if (myrequest[i] == "") {   
                      
            }
            else {
                myrequestlist.push(myrequest[i]);
            }
        }

        //requestStr += '  "joint_target__fmt": "' + request.body.joint_target__fmt + '", <br>';
        requestStr += '"joint_target": ' + joint_target[0] + ', ' + joint_target[1] + ', ' + joint_target[2] + ',<br>';
        requestStr += '"manipulator": ' + request.body.manipulator + ',<br>';
        requestStr += '"obstacles": <br>' ;
        for (i=0; i < circle.length; i++) {
            requestStr += '{  "type": "circle" <br>   "radius": '+circle[i][0]+'  "center": '+circle[i][1]+","+circle[i][2]+'<br>   "posangle": '+circle[i][3]+', '+circle[i][4]+', '+circle[i][5]+'<br>'
            requestStr += '   "name": ' + circle[i][6] + circle[i][7] + circle[i][8] + " }";
        }
        for (i=0; i < rectangle.length; i++) {
            requestStr += '<br>{  "type": "rectangle" <br>   "extent": '+rectangle[i][0]+", "+rectangle[i][1]+'  "center": '+rectangle[i][2]+","+rectangle[i][3]+'<br>   "posangle": '+rectangle[i][4]+', '+rectangle[i][5]+', '+rectangle[i][6]+"<br>"
            requestStr += '   "name": ' + rectangle[i][7] + rectangle[i][8] + rectangle[i][9] + " }";
        }

        requestStr += '<br>Request:<br>{  "n_steps": ' + myrequestlist[2] + ', "manip": ' + myrequestlist[4] + ', "start_fixed": '+ myrequestlist[6]+",<br>";
        requestStr += '   "costs": '+myrequestlist[9]+', "coefficients": '+myrequestlist[12]+',<br>   "collision": "coefficients:"'+ myrequestlist[17]+' "dist_pen": '+myrequestlist[19];
        requestStr += '<br>   "constraints: "joint_values" '+myrequestlist[25].substring(1,6)+', '+myrequestlist[26].substring(1,6)+', '+myrequestlist[27].substring(1,6)
        requestStr += '<br>   "init_info:" "type": '+myrequestlist[30] + ' }<br>}';
        document.getElementById('request').innerHTML = requestStr.split(" ").join("&nbsp;");
        
        document.getElementById('notificationstextKinematics').innerHTML = "Sent a request to the <tt>optimize</tt> method of the <tt>example/Trajopt</tt> service";
        document.getElementById('notificationsdetails').style.display="inline";
    });
    
    services["trajopt/Trajopt"].onResponse(function(request, response) {
        var responseStr = "<span class=\"data-header\">Response:</span> <br>";
        responseStr += "{ <br>";
        
        var result = response.result;
        if (result) {
            for (var i=0; i<result.length; i++) {
                for (var j=0; j < result[i].length; j++) {
                    result[i][j] = result[i][j].toFixed(2);
                }
            }
            
            responseStr += '  "result": [ <br>';
            for (var i=0; i<result.length; i++) {
                responseStr += '    [' + result[i][0] + ', ' + result[i][1] + ', ' + result[i][2] + ' ], <br>'
            }
            responseStr += '  ] <br>';
            responseStr += '}';
        }
        var notificationstextKinematics = "Called the <tt>optimize</tt> method of the <tt>example/Trajopt</tt> service";
        if (!result.length) {
            notificationstextKinematics += " but there were no collision-free trajectories found";
        }
        document.getElementById('response').innerHTML = responseStr.split(" ").join("&nbsp;");
        document.getElementById('notificationstextKinematics').innerHTML = notificationstextKinematics;

        document.getElementById('notificationsdetails').style.display="inline";
    });
}

var showDetails = false;
function showHideDetails() {
    showDetails = !showDetails;

    if (showDetails) {
        document.getElementById('requestresponsedisplay').style.display = "block";
        document.getElementById('notificationsdetails').innerHTML = "Hide Details";
    } else {
        document.getElementById('requestresponsedisplay').style.display = "none";
        document.getElementById('notificationsdetails').innerHTML = "Show Details";
    }
}

function doTrajopt() {
    var manipulator = robots[0].activeManipulator;
    
    var endPoseItem = indicators['EndEffectorPose'].poseItem;
    var robotOffset = robots[0].translation;
    var vector = Vector.translate(endPoseItem.vector, -robotOffset.x, -robotOffset.y);
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
            return null;
        }
        
        // Trajopt
        var jointStart = robots[0].getJointAngles();
        for (var index = 0; index < jointStart.length; index++) {
            jointStart[index] *= Math.PI/180;
        }
        services["trajopt/Trajopt"].optimize(jointStart, jointTarget, robots[0].activeManipulator, function(xmlHttp) {
            var jointTrajectory = JSON.parse(xmlHttp.responseText)["result"];
            console.log("trajopt", jointTrajectory);
            
            var trajIndex = 0;
            var sICounter = setInterval(function() {
                if (trajIndex == jointTrajectory.length) {
                    clearInterval(sICounter);
                    return;
                }
                
                var jointAngles = jointTrajectory[trajIndex];
                for (var index = 0; index < jointAngles.length; index++) {
                    jointAngles[index] *= 180/Math.PI;
                }
                robots[0].setJointAngles(jointAngles);
                console.log(jointAngles);
                
                console.log(trajIndex);
                trajIndex += 1;
            }, 500);
        });
    });
}


function kinematicsInitialize() {
    // Stage
    var canvas = document.getElementById('testCanvas');
    stage = new createjs.Stage(canvas);
    stage.width = canvas.width;
    stage.height = canvas.height;
    stage.mouseMoveOutside = false;
    
    // Items
    // new EllipseObstacle(200, 300, 80, 80);
    new RectObstacle(700, 400, 160, 80, "#96B2D0");
    new CircleObstacle(200, 300, 40, "#96B2D0");
    
    // Robot
    var robot = new TriDOFRobotModed(480, 250)
    robot.setJointAngles([-10, 90, -80]).activeManipulator = "arm";
    
    // Services
    new HelloWorldService();
    new KinematicsService();
    new TrajoptService();
    
    // Modes
    new NormalMode();
    new RemoveMode('removeModeButton');
    new AddPoseMode('addPoseModeButton');
    new AddRectObstacleMode("addRectObstacleModeButton", undefined, undefined, "#96B2D0");
    new AddCircleObstacleMode("addCircleObstacleModeButton", undefined, "#96B2D0");
    
    // Service Indicators
    new KinematicsServiceIndicator('kinematicsIndicatorButton', robot);
    new TrajoptServiceIndicator('trajoptIndicatorButton', robot);
    
    
    Mode.switchTo(modes["Normal"]);
}