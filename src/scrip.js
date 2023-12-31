
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 370,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    input: {
        multitouch: true
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    }
};

var score = 0;
var scoreText;
var gameOver = false;
var restartButton;

var player;
var stars;
var bombs;

var collectStarSound;
var hitBombSound;
var backgroundMusic;

var leftButton;
var rightButton;
var jumpButton;

var isPlayerMoving = false;
var isJumping = false;

var game = new Phaser.Game(config);

function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('floor', 'assets/floor.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('leftButton', 'assets/leftButton.png');
    this.load.image('rightButton', 'assets/rightButton.png');
    this.load.image('jumpButton', 'assets/jumpButton.png');

    this.load.audio('collectStar', 'assets/collectStar.mp3');
    this.load.audio('hitBomb', 'assets/hitBomb.mp3');
    this.load.audio('backgroundMusic', 'assets/backgroundMusic.mp3');
}

function create() {
    collectStarSound = this.sound.add('collectStar');
    hitBombSound = this.sound.add('hitBomb');
    backgroundMusic = this.sound.add('backgroundMusic', { loop: true });

    backgroundMusic.play();

    this.add.image(400, 185, 'sky');

    var platforms = this.physics.add.staticGroup();
    platforms.create(400, 330, 'floor').setScale(2).refreshBody();
    platforms.create(130, 110, 'ground').setScale(0.4).refreshBody();
    platforms.create(600, 220, 'ground').setScale(0.4).refreshBody();
    platforms.create(450, 100, 'ground').setScale(0.4).refreshBody();
    platforms.create(750, 110, 'ground').setScale(0.4).refreshBody();
    platforms.create(250, 220, 'ground').setScale(0.4).refreshBody();

    player = this.physics.add.sprite(100, 250, 'dude');
    player.setCollideWorldBounds(true);
    player.setBounce(0.1);

    this.physics.add.collider(player, platforms, function () {
        if (!player.body.touching.down && player.body.velocity.y < 0) {
            player.setVelocityY(0);
        }
    });

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20,
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(stars, platforms);

    this.physics.add.overlap(player, stars, collectStar, null, this);

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFFFFF' });

    bombs = this.physics.add.group();

    this.physics.add.collider(bombs, platforms);

    this.physics.add.collider(player, bombs, hitBomb, null, this);

    restartButton = this.add.text(400, 16, 'Restart', { fontSize: '32px', fill: '#00FF00' })
        .setOrigin(0.5, 0)
        .setInteractive()
        .on('pointerdown', function () {
            restartGame.call(this);
        }, this);

    leftButton = this.add.sprite(50, 320, 'leftButton').setInteractive();
    leftButton.setScrollFactor(0);
    leftButton.setScale(2);

    rightButton = this.add.sprite(170, 320, 'rightButton').setInteractive();
    rightButton.setScrollFactor(0);
    rightButton.setScale(2);

    jumpButton = this.add.sprite(750, 320, 'jumpButton').setInteractive();
    jumpButton.setScrollFactor(0);
    jumpButton.setScale(2);

    leftButton.on('pointerdown', function () {
        player.setVelocityX(-350);
        player.anims.play('left', true);
        isPlayerMoving = true;
    });

    leftButton.on('pointerup', function () {
        player.setVelocityX(0);
        updatePlayerAnimation();
        isPlayerMoving = false;
    });

    rightButton.on('pointerdown', function () {
        player.setVelocityX(350);
        player.anims.play('right', true);
        isPlayerMoving = true;
    });

    rightButton.on('pointerup', function () {
        player.setVelocityX(0);
        updatePlayerAnimation();
        isPlayerMoving = false;
    });

    jumpButton.on('pointerdown', function () {
        if (player.body.touching.down) {
            player.setVelocityY(-600);
            isJumping = true;
        }
    });

    jumpButton.on('pointerup', function () {
        isJumping = false;
    });

    this.cameras.main.setBounds(0, 0, 800, 370);
    this.physics.world.setBounds(0, 0, 800, 370);
    this.cameras.main.startFollow(player, true, 0.08, 0.08);
}

function updatePlayerAnimation() {
    if (player.body.velocity.x < 0) {
        player.anims.play('left', true);
    } else if (player.body.velocity.x > 0) {
        player.anims.play('right', true);
    } else {
        player.anims.play('turn');
    }
}

function update() {
    if (gameOver) {
        return;
    }

    if (isPlayerMoving) {
        updatePlayerAnimation();
    }

    if (isJumping && player.body.touching.down) {
        isJumping = false;
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);

    score += 10;
    scoreText.setText('Score: ' + score);

    collectStarSound.play();

    if (stars.countActive(true) === 0) {
        stars.children.iterate(function (child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

function hitBomb(player, bomb) {
    this.physics.pause();

    player.setTint(0xD5031A);

    player.anims.stop();
    isPlayerMoving = false;

    hitBombSound.play();

    var doubtText = this.add.text(player.x, player.y - 30, 'OH NO!', { fontSize: '30px', fill: '#FF0000' })
        .setOrigin(0.5, 0);

    this.time.delayedCall(2000, function () {
        doubtText.destroy();
    }, [], this);

    this.time.delayedCall(3000, function () {
        restartGame.call(this);
    }, [], this);

    gameOver = true;
}

function restartGame() {
    gameOver = false;
    this.physics.resume();
    player.clearTint();
    player.setX(100);
    player.setY(250);

    player.anims.play('turn');
    isPlayerMoving = true;

    stars.children.iterate(function (child) {
        child.enableBody(true, child.x, 0, true, true);
    });

    bombs.clear(true, true);

    score = 0;
    scoreText.setText('Score: ' + score);
}
