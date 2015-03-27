function graspingSetup() {
    onReadyDefinition();
    graspingInitialize();
}

function graspingInitialize() {
    // Stage
    var canvas = document.getElementById('testCanvas');
    stage = new createjs.Stage(canvas);
    stage.width = canvas.width;
    stage.height = canvas.height;
    stage.mouseMoveOutside = false;
    
    // Gripper
    var gripper = new Gripper(stage.width/2, stage.height-20)
    
    // Services
    new GraspingService();
    
    // Service Indicators
    new GraspingServiceIndicator('graspingIndicatorButton', gripper,
                                 { 'prevButtonId': 'prevGraspButton',
                                   'nextButtonId': 'nextGraspButton',
                                   'graspQualityDivId': 'graspQualityDiv',
                                   'graspIndexDivId': 'graspIndexDiv',
                                   'gripperWidthInputId': 'gripperWidthInput',
                                   'numSamplesInputId': 'numSamplesInput',
                                   'posVarianceInputId': 'posVarianceInput',
                                   'angVarianceInputId': 'angVarianceInput',
                                   'dynamicHelpDivId': 'dynamichelp',
                                   'notificationsTextDivId': 'notificationstextGrasping' });
    
    Polygon.init('#777', '#96B2D0', '#00CC00');
}