/* Saber Showdown: static, dependency-light foundation prepared for a future network input adapter. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const settings = {
    blade: 0x45f6ff,
    hilt: 0x303a49,
    shirt: 0x1679c3,
    pants: 0x202a39,
  };
  const DIFFICULTIES = {
    Easy: { reaction: 0.56, accuracy: 0.43, aggression: 0.3, spacing: 2.5 },
    Normal: { reaction: 0.34, accuracy: 0.63, aggression: 0.48, spacing: 2.25 },
    Hard: { reaction: 0.2, accuracy: 0.78, aggression: 0.6, spacing: 2.1 },
    Master: { reaction: 0.11, accuracy: 0.9, aggression: 0.68, spacing: 2.0 },
  };
  let difficulty = "Normal",
    running = false,
    paused = false,
    cameraYaw = 0,
    cameraPitch = 0.27,
    shake = 0,
    audio = null,
    last = performance.now(),
    clashUntil = 0;
  const keys = {},
    input = { x: 0, z: 0, block: false };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06101d);
  scene.fog = new THREE.FogExp2(0x06101d, 0.025);
  const camera = new THREE.PerspectiveCamera(
      58,
      innerWidth / innerHeight,
      0.1,
      100,
    ),
    renderer = new THREE.WebGLRenderer({
      canvas: $("game-canvas"),
      antialias: true,
    });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.add(new THREE.HemisphereLight(0xbde8ff, 0x101426, 0.85));
  const sun = new THREE.DirectionalLight(0xcfe8ff, 1.25);
  sun.position.set(9, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(15, 64),
    new THREE.MeshStandardMaterial({
      color: 0x16283b,
      roughness: 0.56,
      metalness: 0.3,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(30, 30, 0x27617f, 0x1a3448);
  grid.position.y = 0.01;
  scene.add(grid);
  const arena = new THREE.Group();
  scene.add(arena);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x243c56,
    roughness: 0.45,
    metalness: 0.5,
  });
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4,
      x = Math.cos(a) * 13,
      z = Math.sin(a) * 13;
    const p = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.65, 4.6, 10),
      pillarMat,
    );
    p.position.set(x, 2.3, z);
    p.castShadow = p.receiveShadow = true;
    arena.add(p);
    const lamp = new THREE.PointLight(0x267dff, 0.7, 5);
    lamp.position.set(x, 4.3, z);
    arena.add(lamp);
  }
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0x1a6390 }),
  );
  moon.position.set(-14, 10, -20);
  scene.add(moon);
  function material(color, emissive = 0) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.25,
      emissive,
      emissiveIntensity: emissive ? 1.2 : 0,
    });
  }
  function fighter(name, shirt, pants, blade, hilt) {
    const g = new THREE.Group(),
      skin = material(0xf0b58d),
      sm = material(shirt),
      pm = material(pants);
    const box = (geo, mat, x, y, z) => {
      let m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      g.add(m);
      return m;
    };
    box(new THREE.BoxGeometry(0.82, 1, 0.43), sm, 0, 1.15, 0);
    const head = box(new THREE.BoxGeometry(0.48, 0.48, 0.48), skin, 0, 1.9, 0);
    const arm = (side) => {
      let pivot = new THREE.Group();
      pivot.position.set(side * 0.55, 1.52, 0);
      let m = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.88, 0.25), sm);
      m.position.y = -0.43;
      m.castShadow = true;
      pivot.add(m);
      g.add(pivot);
      return pivot;
    };
    const rArm = arm(1),
      lArm = arm(-1);
    const leg = (side) => {
      let pivot = new THREE.Group();
      pivot.position.set(side * 0.2, 0.65, 0);
      let m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.29), pm);
      m.position.y = -0.36;
      m.castShadow = true;
      pivot.add(m);
      g.add(pivot);
      return pivot;
    };
    const rLeg = leg(1),
      lLeg = leg(-1);
    const saber = new THREE.Group();
    saber.position.set(0, -0.85, 0.08);
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.38, 10),
      material(hilt),
    );
    handle.rotation.x = Math.PI / 2;
    saber.add(handle);
    const bladeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.52, 10),
      material(blade, blade),
    );
    bladeMesh.position.z = 0.92;
    bladeMesh.rotation.x = Math.PI / 2;
    saber.add(bladeMesh);
    const light = new THREE.PointLight(blade, 1.2, 4);
    light.position.z = 0.8;
    saber.add(light);
    rArm.add(saber);
    g.userData = {
      name,
      head,
      rArm,
      lArm,
      rLeg,
      lLeg,
      blade: bladeMesh,
      light,
      shirt: sm,
      pants: pm,
      handle: handle.material,
      tip: new THREE.Vector3(),
      base: new THREE.Vector3(),
    };
    return g;
  }
  const player = fighter(
      "You",
      settings.shirt,
      settings.pants,
      settings.blade,
      settings.hilt,
    ),
    enemy = fighter("Bot", 0xb82e45, 0x1c2330, 0xff466c, 0x353b46);
  player.position.set(0, 0, 4);
  enemy.position.set(0, 0, -4);
  scene.add(player, enemy);
  function newState() {
    return {
      hp: 100,
      stamina: 100,
      action: null,
      actionTime: 0,
      hitDone: false,
      combo: 0,
      comboUntil: 0,
      block: false,
      blockSince: -9,
      stun: 0,
      invuln: 0,
      dash: 0,
      knock: new THREE.Vector3(),
      hitFlash: 0,
      ai: { next: 0, seen: 0 },
    };
  }
  const P = newState(),
    E = newState();
  const ATTACKS = {
    light1: {
      duration: 0.43,
      active: [0.16, 0.28],
      cost: 13,
      damage: 9,
      guard: 18,
      range: 2.25,
      angle: -1.3,
    },
    light2: {
      duration: 0.45,
      active: [0.15, 0.3],
      cost: 14,
      damage: 10,
      guard: 20,
      range: 2.3,
      angle: 1.4,
    },
    light3: {
      duration: 0.54,
      active: [0.2, 0.38],
      cost: 18,
      damage: 16,
      guard: 30,
      range: 2.45,
      angle: -0.1,
    },
    heavy: {
      duration: 0.78,
      active: [0.34, 0.55],
      cost: 32,
      damage: 25,
      guard: 43,
      range: 2.55,
      angle: 1.8,
    },
  };
  function sound(kind) {
    try {
      audio ??= new AudioContext();
      const o = audio.createOscillator(),
        g = audio.createGain();
      const data = {
        swing: [130, 0.035, "sine"],
        hit: [70, 0.11, "sawtooth"],
        clash: [520, 0.08, "square"],
        parry: [820, 0.12, "sine"],
        dash: [180, 0.06, "triangle"],
        break: [55, 0.2, "sawtooth"],
      }[kind] || [200, 0.05, "sine"];
      o.type = data[2];
      o.frequency.setValueAtTime(data[0], audio.currentTime);
      o.frequency.exponentialRampToValueAtTime(
        Math.max(30, data[0] * 0.55),
        audio.currentTime + data[1],
      );
      g.gain.setValueAtTime(0.06, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + data[1]);
      o.connect(g).connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + data[1]);
    } catch (e) {
      /* Audio may be unavailable until a user gesture. */
    }
  }
  function effect(pos, color, size = 0.3) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(size, 8, 6),
      new THREE.MeshBasicMaterial({ color, transparent: true }),
    );
    m.position.copy(pos);
    scene.add(m);
    setTimeout(() => scene.remove(m), 100);
  }
  function saberPoint(obj, key) {
    obj.updateMatrixWorld(true);
    return obj.userData.blade.localToWorld(
      new THREE.Vector3(0, 0, key === "tip" ? 1.65 : 0.18),
    );
  }
  function startAttack(s, kind) {
    if (
      !running ||
      s.stun > 0 ||
      s.action ||
      s.block ||
      s.stamina < ATTACKS[kind].cost
    )
      return false;
    s.action = kind;
    s.actionTime = 0;
    s.hitDone = false;
    s.stamina -= ATTACKS[kind].cost;
    sound("swing");
    return true;
  }
  function light(s) {
    let n = s.comboUntil > performance.now() && s.combo < 2 ? s.combo + 1 : 0;
    if (startAttack(s, ["light1", "light2", "light3"][n])) s.combo = n;
  }
  function dash(s, obj, target) {
    if (!running || s.stun > 0 || s.dash > 0 || s.stamina < 20) return;
    s.stamina -= 20;
    s.dash = 0.18;
    s.invuln = 0.13;
    let d = new THREE.Vector3().subVectors(target.position, obj.position);
    d.y = 0;
    if (d.lengthSq() < 0.1) d.set(0, 0, -1);
    s.dashDir = d.normalize();
    sound("dash");
    effect(obj.position, 0x8cecff, 0.2);
  }
  function damage(att, ao, def, doo, a) {
    if (def.invuln > 0) return;
    if (def.block) {
      const perfect = performance.now() - def.blockSince < 180;
      if (perfect) {
        att.stun = 0.72;
        att.action = null;
        def.stamina = Math.min(100, def.stamina + 8);
        flash("PERFECT PARRY!");
        effect(saberPoint(doo, "tip"), 0xffffff, 0.28);
        sound("parry");
        shake = 0.16;
        return;
      }
      def.stamina = Math.max(0, def.stamina - a.guard);
      effect(saberPoint(doo, "tip"), 0xffd166, 0.22);
      sound("clash");
      if (def.stamina === 0) {
        def.block = false;
        def.stun = 1.05;
        flash("GUARD BROKEN!");
        sound("break");
      }
      return;
    }
    def.hp = Math.max(0, def.hp - a.damage);
    def.hitFlash = 0.18;
    def.knock.add(
      new THREE.Vector3()
        .subVectors(doo.position, ao.position)
        .setY(0)
        .normalize()
        .multiplyScalar(a.damage * 0.035),
    );
    effect(doo.position, 0xff5573, 0.23);
    sound("hit");
    shake = 0.1;
  }
  function updateAction(s, o, other, oo, dt) {
    if (!s.action) return;
    const a = ATTACKS[s.action];
    s.actionTime += dt;
    const t = s.actionTime / a.duration;
    const swing = Math.sin(Math.min(1, t) * Math.PI);
    o.userData.rArm.rotation.set(
      -1.2 + a.angle * swing,
      Math.sin(t * Math.PI) * 0.7,
      0,
    );
    if (!s.hitDone && t >= a.active[0] && t <= a.active[1]) {
      const distance = saberPoint(o, "tip").distanceTo(saberPoint(oo, "base"));
      if (
        distance < a.range &&
        o.position.distanceTo(oo.position) < a.range + 0.4
      ) {
        s.hitDone = true;
        damage(s, o, other, oo, a);
      }
    }
    if (t >= 1) {
      s.action = null;
      s.comboUntil = performance.now() + 430;
      if (s.combo === 2) s.combo = 0;
    }
  }
  function block(s, on) {
    if (!running || s.stun > 0) return;
    if (on && !s.block) {
      s.block = true;
      s.blockSince = performance.now();
    }
    if (!on) s.block = false;
  }
  function moveState(s, o, dt) {
    s.stun = Math.max(0, s.stun - dt);
    s.invuln = Math.max(0, s.invuln - dt);
    s.hitFlash = Math.max(0, s.hitFlash - dt);
    s.stamina = clamp(
      s.stamina + (s.block || s.action || s.dash || s.stun ? 7 : 20) * dt,
      0,
      100,
    );
    if (s.dash > 0) {
      s.dash -= dt;
      o.position.addScaledVector(s.dashDir, 12 * dt);
    }
    o.position.addScaledVector(s.knock, dt * 8);
    s.knock.multiplyScalar(Math.max(0, 1 - dt * 8));
    const radius = o.position.length();
    if (radius > 12) o.position.multiplyScalar(12 / radius);
  }
  function animateFighter(o, s, time) {
    const u = o.userData,
      walking = !s.action && !s.block && s.stun <= 0 && s.dash <= 0;
    if (s.stun > 0) {
      u.head.rotation.z = Math.sin(time * 18) * 0.15;
      u.rArm.rotation.set(0.1, 0, -0.7);
      return;
    }
    u.head.rotation.z = 0;
    if (s.block) {
      u.rArm.rotation.set(-1.55, 0, 0.65);
      u.lArm.rotation.set(-0.5, 0, -0.3);
    } else if (!s.action) u.rArm.rotation.set(-1.15, -0.15, 0);
    const walk = walking ? Math.sin(time * 11) * 0.45 : 0;
    u.rLeg.rotation.x = walk;
    u.lLeg.rotation.x = -walk;
    u.lArm.rotation.x = -walk * 0.45;
    u.shirt.emissive.setHex(s.hitFlash ? 0x55111a : 0);
  }
  function bot(dt) {
    const cfg = DIFFICULTIES[difficulty],
      now = performance.now(),
      dist = enemy.position.distanceTo(player.position);
    if (now < E.ai.next || E.stun > 0) return;
    E.ai.next = now + (cfg.reaction * 600 + Math.random() * 180);
    const playerAttacking = !!P.action;
    if (playerAttacking && dist < 2.7 && Math.random() < cfg.accuracy) {
      if (E.stamina > 20 && Math.random() < 0.42) dash(E, enemy, player);
      else block(E, true);
      setTimeout(() => block(E, false), 220);
      return;
    }
    if (E.stamina < 24) {
      block(E, Math.random() < 0.65);
      return;
    }
    if (dist > cfg.spacing + 0.35) {
      let d = new THREE.Vector3()
        .subVectors(player.position, enemy.position)
        .setY(0)
        .normalize();
      enemy.position.addScaledVector(d, dt * 7);
      return;
    }
    if (dist < 1.45 && Math.random() < 0.55) {
      let d = new THREE.Vector3()
        .subVectors(enemy.position, player.position)
        .setY(0)
        .normalize();
      enemy.position.addScaledVector(d, dt * 4);
      return;
    }
    block(E, false);
    if (Math.random() < cfg.aggression) {
      if (Math.random() < 0.2 && E.stamina > 35) startAttack(E, "heavy");
      else light(E);
    }
  }
  function handleBladeClash(now) {
    if (now < clashUntil || !P.action || !E.action) return;
    const a = saberPoint(player, "tip"),
      b = saberPoint(enemy, "tip");
    if (a.distanceTo(b) < 0.72) {
      clashUntil = now + 180;
      const mid = a.add(b).multiplyScalar(0.5);
      effect(mid, 0xffffff, 0.18);
      sound("clash");
      flash("SABERS CLASH!");
      shake = 0.06;
      P.actionTime = Math.max(0, P.actionTime - 0.04);
      E.actionTime = Math.max(0, E.actionTime - 0.04);
    }
  }
  function flash(text) {
    $("status-message").textContent = text;
    clearTimeout(flash.timer);
    flash.timer = setTimeout(() => ($("status-message").textContent = ""), 650);
  }
  function updateUI() {
    for (const [id, s] of [
      ["player", P],
      ["enemy", E],
    ]) {
      $(id + "-hp").style.width = s.hp + "%";
      $(id + "-stamina").style.width = s.stamina + "%";
      $(id + "-stamina").parentElement.parentElement.classList.toggle(
        "low-stamina",
        s.stamina < 25,
      );
    }
    $("combo-text").textContent = P.combo ? `COMBO x${P.combo + 1}` : "";
  }
  function reset() {
    Object.assign(P, newState());
    Object.assign(E, newState());
    player.position.set(0, 0, 4);
    enemy.position.set(0, 0, -4);
    cameraYaw = 0;
    cameraPitch = 0.27;
  }
  function start() {
    reset();
    running = true;
    paused = false;
    document
      .querySelectorAll(".screen.active")
      .forEach((screen) => screen.classList.remove("active"));
    $("hud").style.display = "flex";
    $("pause-menu").classList.remove("active");
    $("game-over").classList.remove("active");
  }
  function end(win) {
    running = false;
    $("result").textContent = win ? "VICTORY" : "DEFEAT";
    $("result-detail").textContent = win
      ? `You defeated the ${difficulty} bot.`
      : "Recover, read its rhythm, and try again.";
    $("game-over").classList.add("active");
  }
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    const time = now / 1000;
    if (running && !paused) {
      if (P.hp <= 0) end(false);
      if (E.hp <= 0) end(true);
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          cameraYaw,
        ),
        right = new THREE.Vector3(1, 0, 0).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          cameraYaw,
        );
      input.x = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) || input.x;
      input.z = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) || input.z;
      let mv = right
        .multiplyScalar(input.x)
        .add(forward.multiplyScalar(input.z));
      if (mv.lengthSq() > 0.02 && P.stun <= 0 && !P.block) {
        mv.normalize();
        player.position.addScaledVector(mv, (P.dash > 0 ? 10 : 4.5) * dt);
      }
      block(P, input.block || !!keys.KeyL);
      moveState(P, player, dt);
      moveState(E, enemy, dt);
      player.rotation.y = cameraYaw + Math.PI;
      enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
      bot(dt);
      handleBladeClash(now);
      updateAction(P, player, E, enemy, dt);
      updateAction(E, enemy, P, player, dt);
      animateFighter(player, P, time);
      animateFighter(enemy, E, time);
      const head = player.position.clone().add(new THREE.Vector3(0, 1.4, 0)),
        off = new THREE.Vector3(
          6.4 * Math.sin(cameraYaw) * Math.cos(cameraPitch),
          6.4 * Math.sin(cameraPitch),
          6.4 * Math.cos(cameraYaw) * Math.cos(cameraPitch),
        );
      camera.position.copy(head).add(off);
      if (shake > 0) {
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
        shake = Math.max(0, shake - dt * 0.8);
      }
      camera.lookAt(head);
      updateUI();
    }
    renderer.render(scene, camera);
  }
  function makeOptions(id, values, key) {
    for (const [label, value] of values) {
      let b = document.createElement("button");
      b.className = "swatch" + (settings[key] === value ? " selected" : "");
      b.title = label;
      b.style.background = "#" + value.toString(16).padStart(6, "0");
      b.onclick = () => {
        settings[key] = value;
        document
          .querySelectorAll("#" + id + " .swatch")
          .forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
        const u = player.userData;
        if (key === "blade") {
          u.blade.material.color.setHex(value);
          u.blade.material.emissive.setHex(value);
          u.light.color.setHex(value);
        } else if (key === "hilt") u.handle.color.setHex(value);
        else u[key].color.setHex(value);
      };
      $(id).append(b);
    }
  }
  makeOptions(
    "blade-options",
    [
      ["Cyan", 0x45f6ff],
      ["Green", 0x56ff99],
      ["Violet", 0xa873ff],
      ["Amber", 0xffbf45],
      ["Crimson", 0xff4267],
    ],
    "blade",
  );
  makeOptions(
    "hilt-options",
    [
      ["Steel", 0x303a49],
      ["Gold", 0x9b7428],
      ["Black", 0x11141b],
      ["White", 0xd6e2ea],
    ],
    "hilt",
  );
  makeOptions(
    "shirt-options",
    [
      ["Blue", 0x1679c3],
      ["Red", 0xb8324a],
      ["Green", 0x278a61],
      ["White", 0xcdd8e5],
    ],
    "shirt",
  );
  makeOptions(
    "pants-options",
    [
      ["Navy", 0x202a39],
      ["Black", 0x12151b],
      ["Tan", 0x806543],
      ["Gray", 0x596473],
    ],
    "pants",
  );
  for (const [name, cfg] of Object.entries(DIFFICULTIES)) {
    let b = document.createElement("button");
    b.className = "difficulty";
    b.innerHTML = `<strong>${name}</strong><small>Reaction: ${Math.round(cfg.reaction * 1000)}ms · disciplined stamina</small>`;
    b.onclick = () => {
      difficulty = name;
      $("enemy-name").textContent = name.toUpperCase();
      start();
    };
    $("difficulty-list").append(b);
  }
  $("play-bot").onclick = () => {
    $("main-menu").classList.remove("active");
    $("difficulty-menu").classList.add("active");
  };
  $("open-customize").onclick = () => {
    $("main-menu").classList.remove("active");
    $("customize-menu").classList.add("active");
  };
  document.querySelectorAll(".back").forEach(
    (b) =>
      (b.onclick = () => {
        document
          .querySelectorAll(".screen")
          .forEach((x) => x.classList.remove("active"));
        $("main-menu").classList.add("active");
      }),
  );
  $("pause-button").onclick = () => {
    if (running) {
      paused = true;
      $("pause-menu").classList.add("active");
    }
  };
  $("resume").onclick = () => {
    paused = false;
    $("pause-menu").classList.remove("active");
  };
  $("restart").onclick = () => {
    reset();
    paused = false;
    $("pause-menu").classList.remove("active");
  };
  $("rematch").onclick = start;
  document.querySelectorAll(".to-menu").forEach(
    (b) =>
      (b.onclick = () => {
        running = false;
        paused = false;
        $("hud").style.display = "none";
        document
          .querySelectorAll(".modal")
          .forEach((x) => x.classList.remove("active"));
        $("main-menu").classList.add("active");
      }),
  );
  addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyJ") light(P);
    if (e.code === "KeyK") startAttack(P, "heavy");
    if (e.code === "Space") {
      e.preventDefault();
      dash(P, player, enemy);
    }
    if (e.code === "Escape" && running) $("pause-button").click();
  });
  addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });
  let drag = false,
    px = 0,
    py = 0;
  renderer.domElement.addEventListener("pointerdown", (e) => {
    drag = true;
    px = e.clientX;
    py = e.clientY;
    renderer.domElement.setPointerCapture?.(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (drag) {
      cameraYaw -= (e.clientX - px) * 0.012;
      cameraPitch = clamp(cameraPitch + (e.clientY - py) * 0.008, 0.08, 1);
      px = e.clientX;
      py = e.clientY;
    }
  });
  addEventListener("pointerup", () => (drag = false));
  const joy = $("joystick"),
    stick = $("stick");
  joy.addEventListener("pointerdown", (e) => {
    joy.setPointerCapture(e.pointerId);
    function move(v) {
      let r = joy.getBoundingClientRect(),
        x = clamp(v.clientX - (r.left + r.width / 2), -40, 40),
        y = clamp(v.clientY - (r.top + r.height / 2), -40, 40);
      stick.style.transform = `translate(${x}px,${y}px)`;
      input.x = x / 40;
      input.z = -y / 40;
    }
    move(e);
    joy.onpointermove = move;
    joy.onpointerup = () => {
      input.x = input.z = 0;
      stick.style.transform = "";
      joy.onpointermove = null;
    };
  });
  document.querySelectorAll("#mobile-actions button").forEach((b) => {
    const a = b.dataset.action;
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (a === "light") light(P);
      if (a === "heavy") startAttack(P, "heavy");
      if (a === "dash") dash(P, player, enemy);
      if (a === "block") {
        input.block = true;
        block(P, true);
      }
    });
    b.addEventListener("pointerup", () => {
      if (a === "block") {
        input.block = false;
        block(P, false);
      }
    });
    b.addEventListener("pointercancel", () => {
      input.block = false;
      block(P, false);
    });
  });
  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  requestAnimationFrame(frame);
})();
