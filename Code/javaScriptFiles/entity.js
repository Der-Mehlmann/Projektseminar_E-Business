export class Entity {

    static FOVwidthMiddle
    static FOVheightMiddle
    globalEntityX
    globalEntityY
    hitbox
    png

    constructor(globalEntityX, globalEntityY, hitbox, png) {
        this.globalEntityX = globalEntityX
        this.globalEntityY = globalEntityY
        this.hitbox = hitbox

        if (typeof png === 'string') {
            this.png = new Image()
            this.png.src = png
        } else {
            this.png = png
        }
    }

    getColor() {
        return "magenta"
    }

    checkCollisionWithEntity(otherEntity) {
        return !(
            this.globalEntityX + this.hitbox.width < otherEntity.globalEntityX ||
            this.globalEntityX > otherEntity.globalEntityX + otherEntity.hitbox.width ||
            this.globalEntityY + this.hitbox.height < otherEntity.globalEntityY ||
            this.globalEntityY > otherEntity.globalEntityY + otherEntity.hitbox.height
        );
    }
    draw(ctx, player, overrideColor = null) {
        let color = overrideColor || this.getColor()
        let leftBorder = player.globalEntityX + (player.hitbox.width / 2) - Entity.FOVwidthMiddle
        let topBorder = player.globalEntityY + (player.hitbox.height / 2) - Entity.FOVheightMiddle

        if (this.png && this.png.complete && this.png.naturalWidth !== 0) {
            ctx.drawImage(this.png, this.globalEntityX - leftBorder, this.globalEntityY - topBorder, this.hitbox.width, this.hitbox.height);
        } else {
            ctx.beginPath();
            ctx.rect(this.globalEntityX - leftBorder, this.globalEntityY - topBorder, this.hitbox.width, this.hitbox.height);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.stroke();
        }
    }
}