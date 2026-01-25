 import {StaticEntity} from "./staticEntity.js"

export class DropSingleUse extends StaticEntity {
  constructor(x, y, hitbox, png) {
    super(x, y, hitbox, png)
    this.used = false
  }

  apply(player) {}
  getColor() { return "white" }

  tryPickup(player) { //jetzt gleich hier machen, da entity.checkCollisionWithEntity nicht mit equipment Radius funktioniert
      // Distanz berechnen zwischen Item-Mitte und Player-Mitte
      const dx = (this.globalEntityX + this.hitbox.width / 2) - (player.globalEntityX + player.hitbox.width / 2);
      const dy = (this.globalEntityY + this.hitbox.height / 2) - (player.globalEntityY + player.hitbox.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Wenn Distanz kleiner als der Sammelradius des Spielers ist
      if (distance <= player.pickupRadius) {
          this.apply(player);
          return true;
      }
      return false;
  }

  render(ctx, player, enemyItemDrops, position) {
      if (this.tryPickup(player)) enemyItemDrops.splice(position, 1)
      this.draw(ctx, player, this.getColor())
      }
  }

export class AttackBoostDrop extends DropSingleUse {
  constructor(x, y, hitbox, png) {
    super(x, y, hitbox, png)
    this.duration = 10000
    this.damageMultiplier = 2

    const img = new Image()
    img.onload = () => {
      this.hitbox = {
        width: (img.naturalWidth / 8), height: (img.naturalHeight / 8),
      }
    }
    img.src = png
  }

  getColor() { return "red" }

  apply(player) {
  if (!player) return

  const weaponSlots = player.weaponSlots || []
  const hasAnyWeapon = weaponSlots.some(w => w != null)
  if (!hasAnyWeapon) return

  // merken, bis wann der Effekt aktiv ist (für roten Schimmer)
  player.attackBoostActiveUntil = performance.now() + this.duration

  // Basis-Schaden pro Slot merken (damit jede Waffe korrekt zurückgesetzt wird)
  if (!player.baseWeaponDamageBySlot) player.baseWeaponDamageBySlot = []

  // wenn Boost schon aktiv war -> Timer neu starten (Refresh)
  if (player.attackBoostTimeout) clearTimeout(player.attackBoostTimeout)

  // Boost anwenden: ALLE Waffen buffen
  for (let slotIndex = 0; slotIndex < weaponSlots.length; slotIndex++) {
    const weapon = weaponSlots[slotIndex]
    if (!weapon) continue

    // Base-Damage einmalig pro Slot merken
    if (player.baseWeaponDamageBySlot[slotIndex] == null) {
      player.baseWeaponDamageBySlot[slotIndex] = weapon.dmg
    }

    weapon.dmg = player.baseWeaponDamageBySlot[slotIndex] * this.damageMultiplier
  }

  // nach Ablauf: alle Waffen zurücksetzen
  player.attackBoostTimeout = setTimeout(() => {
    for (let slotIndex = 0; slotIndex < weaponSlots.length; slotIndex++) {
      const weapon = weaponSlots[slotIndex]
      if (!weapon) continue

      const baseDmg = player.baseWeaponDamageBySlot?.[slotIndex]
      if (baseDmg != null) weapon.dmg = baseDmg
    }

    player.attackBoostTimeout = null
    player.attackBoostActiveUntil = 0
  }, this.duration)
}

}


export class HealDrop extends DropSingleUse {
  constructor(x, y, hitbox, png) {
    super(x, y, hitbox, png)
    this.healAmount = 200
  }

  getColor() {
    return "green"
  }
  apply(player) {
    if (!player || this.used) return
    this.used = true
    if (typeof player.maxHp === "number") player.hp = Math.min(player.hp + this.healAmount, player.maxHp)
    else player.hp += this.healAmount
  }
}

export class XpMagnetDrop extends DropSingleUse {
  constructor(x, y, hitbox, png) {
    super(x, y, hitbox, png)
    this.radius = 5000
    this.pullSpeed = 10
    const img = new Image()
    img.onload = () => {
      this.hitbox = {
        width: (img.naturalWidth / 8), height: (img.naturalHeight / 8),
      }
    }
    img.src = png
  }

  getColor() { return "pink" }

  apply(player) {
    if (!player || !player.enemyItemDrops) return

    for (const drop of player.enemyItemDrops) {
      if (!(drop instanceof XpDrop)) continue

      const dx = player.globalEntityX - drop.globalEntityX
      const dy = player.globalEntityY - drop.globalEntityY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= this.radius) {
        drop.startPullTo(player, this.pullSpeed)
      }
    }
  }
}

export class XpDrop extends DropSingleUse {
  constructor(x, y, hitbox, png, amount = 2) {
    super(x, y, hitbox, png)
    this.amount = amount
    this.pullTarget = null
    this.pullSpeed = 0

    const img = new Image()
    img.onload = () => {
      this.hitbox = {
        width: (img.naturalWidth / 6), height: (img.naturalHeight / 6),
      }
    }
    img.src = png
  }

  getColor() { return "brown" }

  apply(player) {
    if (!player) return
    player.collectXp(this.amount)
  }

  startPullTo(player, pullSpeed) {
    this.pullTarget = player
    this.pullSpeed = pullSpeed
  }

  updatePull() {
    if (!this.pullTarget) return

    const dx = this.pullTarget.globalEntityX - this.globalEntityX
    const dy = this.pullTarget.globalEntityY - this.globalEntityY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist <= 0) return

    this.globalEntityX += (dx / dist) * this.pullSpeed
    this.globalEntityY += (dy / dist) * this.pullSpeed
  }

  render(ctx, player, enemyItemDrops, position) {
    this.updatePull()
    if (this.tryPickup(player)) {
      enemyItemDrops.splice(position, 1)
      return
    }
    this.draw(ctx, player, this.getColor())
  }
}


class ShockwaveNukeEffect extends StaticEntity {
  constructor(x, y) {
    super(x, y, { width: 0, height: 0 }, null)

    this.isVisualEffect = true
    this.radius = 0
    this.speed = 20
    this.maxRadius = 2500
  }

  render(ctx, player, enemyItemDrops, position) {
    // Shockwave wächst pro Frame
    this.radius += this.speed

    const leftBorder = player.globalEntityX + (player.hitbox.width / 2) - StaticEntity.FOVwidthMiddle
    const topBorder = player.globalEntityY + (player.hitbox.height / 2) - StaticEntity.FOVheightMiddle

    // Shockwave zeichnen (einfacher Kreis)
    ctx.beginPath()
    ctx.arc(
      this.globalEntityX - leftBorder,
      this.globalEntityY - topBorder,
      this.radius,
      0,
      Math.PI * 2
    )
    ctx.strokeStyle = "cyan"
    ctx.lineWidth = 2
    ctx.stroke()


     // Alle Gegner durchgehen und prüfen: Ist ein Gegner innerhalb des aktuellen Radius, wird er sofort getötet.

    const enemies = Game.enemies
    for (let row = 0; row < enemies.length; row++) { //Reihe Y-Richtung
      for (let col = 0; col < enemies[row].length; col++) { //Spalte X-Richtung
        const list = enemies[row][col].within // Enemy-Liste für dieses Grid-Feld (row/col)

        for (let i = list.length - 1; i >= 0; i--) {
          const enemy = list[i]

          // Distanz Gegner <-> Zentrum der Shockwave
          const dx = enemy.globalEntityX - this.globalEntityX
          const dy = enemy.globalEntityY - this.globalEntityY
          const dist = Math.sqrt(dx * dx + dy * dy)

          // Wenn die Shockwave den Gegner erreicht -> tot
          if (dist <= this.radius && !enemy.elite) {
          enemy.takeDmg(999999, enemies, i, player.enemyItemDrops)
          }
        }
      }
    }
    // --- Boden-Items zerstören, wenn Shockwave sie erreicht ---
  for (let i = enemyItemDrops.length - 1; i >= 0; i--) {
    const drop = enemyItemDrops[i]

    // Shockwave selbst / Effekte ignorieren
    if (drop === this) continue
    if (drop?.isVisualEffect) continue

    // XP bleibt liegen
    if (drop instanceof XpDrop) continue

    const dx = drop.globalEntityX - this.globalEntityX
    const dy = drop.globalEntityY - this.globalEntityY
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Item von Shockwave zerstört
    if (dist <= this.radius) {
      enemyItemDrops.splice(i, 1)
    }
  }

    // Wenn die Shockwave "fertig" ist, Effekt entfernen
    if (this.radius >= this.maxRadius) {
      enemyItemDrops.splice(position, 1)
    }
  }
}

export class NukeDrop extends DropSingleUse {
  constructor(x, y, hitbox, png) {
    super(x, y, hitbox, png)
    const img = new Image()
    img.onload = () => {
      this.hitbox = {
        width: (img.naturalWidth / 8), height: (img.naturalHeight / 8),
      }
    }
    img.src = png
  }

  getColor() {
    return "black"
  }

  apply(player) {
  if (!player || !player.enemyItemDrops) return

  player.enemyItemDrops.push(
    new ShockwaveNukeEffect(player.globalEntityX, player.globalEntityY)
  )
  }
}

export class FreezeDrop extends DropSingleUse {
  constructor(x, y, hitbox, png) {
    super(x, y, hitbox, png)
    this.duration = 3000 // 3 Sekunden
    this.radius = 1500   // Radius um den Spieler
    const img = new Image()
    img.onload = () => {
      this.hitbox = {
        width: (img.naturalWidth / 8), height: (img.naturalHeight / 8),
      }
    }
    img.src = png
  }

  getColor() { return "lightcyan" }

  apply(player) {
    if (!player) return
    if (typeof Game === "undefined" || !Game.enemies) return

    const now = performance.now()
    const enemies = Game.enemies

    // alle enemies im Grid prüfen, aber nur die im Radius einfrieren
    for (let row = 0; row < enemies.length; row++) {
      for (let col = 0; col < enemies[row].length; col++) {
        const list = enemies[row][col].within // alle Enemies in diesem Grid-Feld

        for (let i = 0; i < list.length; i++) {
          const enemy = list[i]

          // Distanz Player <-> Enemy
          const dx = enemy.globalEntityX - player.globalEntityX
          const dy = enemy.globalEntityY - player.globalEntityY
          const dist = Math.sqrt(dx * dx + dy * dy)

          // nur im Radius einfrieren
          if (dist <= this.radius) {
            // friert den Enemy bis (now + duration) ein;
            enemy.freeze(now, this.duration)
          }
        }
      }
    }
  }
}

export class InstantLevelDrop extends DropSingleUse {
  constructor(x, y, hitbox, png) {
    super(x, y, hitbox, png)
    const img = new Image()
    img.onload = () => {
      this.hitbox = {
        width: (img.naturalWidth / 8), height: (img.naturalHeight / 8),
      }
    }
    img.src = png
  }

  getColor() { return "gold" }

  apply(player) {
    if (!player) return

    // Fortschritt vorm LevelUp merken (z.B. 0.5 = 50%)
    const ratio = (player.xpForNextLevel > 0) ? (player.xp / player.xpForNextLevel) : 0

    // genau 1 Level geben
    player.lvlUp()

    // Fortschritt im neuen Level wiederherstellen (wieder z.B. 50%)
    player.xp = ratio * player.xpForNextLevel

    // HUD aktualisieren (wie in collectXp)
    if (Game?.hudXpProgress) {
      Game.hudXpProgress.value = player.xp
    } else {
      const hud = document.getElementById("hudXpProgress")
      if (hud) hud.value = player.xp
    }
  }
}
