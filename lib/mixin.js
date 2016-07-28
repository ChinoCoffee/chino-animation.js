/**
 * MixinSprite
 *
 *   From Paper.js' path to Pixi.js' sprite
 */
MixinSprite = function(paperPath, w, h) {
    this.canvas = document.createElement('canvas');

    this.paperPath = paperPath;

    this.canvas.width = w || paperPath.bounds.width;
    this.canvas.height = h || paperPath.bounds.height;

    this.context = this.canvas.getContext('2d');
    this.paper = new paper.PaperScope();
    this.paper.setup(this.canvas);

    var texture = PIXI.Texture.fromCanvas(this.canvas);
    this.texture = texture;

    this.resolution = window.devicePixelRatio;   //1;
    this.dirty = false;
};
MixinSprite.constructor = MixinSprite;
MixinSprite.prototype = Object.create(PIXI.Sprite.prototype);

MixinSprite.prototype.drawRectangle = function() {


};

//PIXI.loader
//.add({url: 'ref/test.svg'}, function () { console.log('test.svg');})
//    .add({url: 'ref/test-photo.jpg'})
//    .load(setup);
//function setup() {
//}
