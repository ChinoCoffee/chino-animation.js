
var stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = "absolute";
stats.domElement.style.left = "0px";
stats.domElement.style.top = "0px";


function CharacterConfig() {
  this.showStats = true;
  this.doAnimation = true;

  this.download = function() {
    // [FIXME] Something is wrong with Safari
	  var svgData = paper.project.exportSVG({ asString: true });
    var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "chino.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };
  this.color = [73, 233, 255, 0.9];

  this.faceAngle = 0.0;

  this.durationTransition = 3.0;
  this.keyframeTransition = [
    {x:0,    y:0,    l:0,      r:0.125},
    {x:0.25, y:1.0,  l:-0.125, r:0.0},
    {x:1.0,  y:1.0,  l:-0.5,   r:0.0},
  ];
  this.durationBlink = 3.0;
  this.keyframeBlink = [
    {x:0,    y:0,   l: 0,    r:0},
    {x:0.61, y:0,   l:-0.04, r:0.04},
    {x:0.65, y:1.0, l:-0.04, r:0.04},
    {x:0.69, y:0,   l:-0.04, r:0.04},
    {x:1.0,  y:0,   l:-0.25, r:0},
  ];
}


window.onload = function() {

  paper.install(window);

  // controller
  var config = new CharacterConfig();
  var gui = new dat.GUI({width: 320});

  var showStats = gui.add(config, 'showStats', true);
  var doAnimation = gui.add(config, 'doAnimation', true);

  gui.add(config, 'faceAngle', -3.0, 3.0);

  //var configVital = gui.addFolder('Vital');
  gui.add(config, 'durationBlink', 0.1, 10.0);
  var durationBlinkController = gui.addEasingFunction(config, 'keyframeBlink');

  //var configExp = gui.addFolder('Expression');
  gui.add(config, 'durationTransition', 0.1, 10.0);
  var durationTransitionController = gui.addEasingFunction(config, 'keyframeTransition');
  //configExp.open();

  gui.add(config, 'download');
  gui.addColor(config, 'color');
  gui.remember(config);

  function updateGUI(obj) {
    // Iterate over all controllers
    for (var i in obj.__controllers) {
      obj.__controllers[i].updateDisplay();
    }
  }

  durationTransitionController.onChange(function(v) {
  });

  showStats.onChange(function(value) {
    var visibility = (value) ? "visible": "hidden";
    stats.domElement.style.visibility = visibility;
  });

  document.body.appendChild(stats.domElement);


  /////////////////////////////////////
  // Chino
  /////////////////////////////////////
  var chino = new Character("Chino", {});
  window.chino = chino;
  var canvas = document.getElementById('canvas');
  paper.setup(canvas);

  paper.project.importSVG('references/chino-bezier-peace.svg', function(svg) {
    chino.loadBaseTemplate();
    chino.render();
  });

  $.getJSON("references/facial-expressions.json", function(data) {
    chino.addExpression('angry', data['chino-bezier-angry.svg']);
    chino.addExpression('eyes-shut', data['chino-bezier-eyes-shut.svg']);
    chino.addExpression('sad', data['chino-bezier-sad.svg']);
  });


  var start = null;

  var ExpressionState = function() {
    this.index = 0;
    this.states = Object.freeze(['peace', 'angry', 'peace', 'sad']);
  };
  ExpressionState.prototype.next = function() { this.index = (this.index + 1) % this.states.length; };
  ExpressionState.prototype.from = function() { return this.states[this.index]; };
  ExpressionState.prototype.to   = function() { return this.states[(this.index + 1) % this.states.length]; };

  var expState = new ExpressionState();
  var prevCursor;

  paper.view.onFrame = function(event) {

    stats.begin();

    if (!config.doAnimation) {
      stats.end();
      return;
    }

    if (!start) start = event.time;

    var cursor = (((event.time - start) * 1000) % (config.durationTransition * 1000)) / (config.durationTransition * 1000);

    updateGUI(gui);

    var ratioTransition = durationTransitionController.setCursor(cursor),
        ratioBlink      = durationBlinkController.setCursor(cursor);

    if (prevCursor !== undefined && cursor < prevCursor) {
      expState.next();
      console.log(expState.from() + '->' + expState.to());
    }

    var from = expState.from(),
        to   = expState.to(),
        exclude_list = ['eyebrow-l', 'eyebrow-r', 'mouth'];

    if (ratioBlink > 0.0) {
      chino.adaptExpression(to, 'eyes-shut', ratioBlink, exclude_list);
    } else {
      chino.adaptExpression(from, to, ratioTransition);
    }

    // render Chino's eyes (which needs special boolean operations)
    chino.renderEyes();

    prevCursor = cursor;

    stats.end();
  };

};
