
/*
 var chino = new Chino();
 chino.bindDatGUI(gui);
 */


function Chino() {
  this.baseTemplateSVG = 'references/chino-bezier-peace.svg';
  this.expressions = 'references/facial-expressions.json';
  Character.call(this);
}

Chino.constructor = Chino;
Chino.prototype = Object.create(Character.prototype);

Chino.prototype.preparePath = function() {

};

Chino.prototype.heartBeat = function() {

};


Chino.prototype.bindDatGUI = function() {

};
