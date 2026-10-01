/* ==========================================================================
   NO MINIMAL — piezas interactivas de las tesis de divulgacion.
   Cada figura declara su pieza con data-nm="...". Sin JavaScript, la figura
   sigue mostrando su dibujo fijo; esto solo le agrega controles.
   ========================================================================== */
(function () {
  "use strict";
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function num(n) { return Math.round(n).toLocaleString("en-US"); }
  function pulsar(grupo, activo) {
    grupo.forEach(function (b) { b.setAttribute("aria-pressed", b === activo ? "true" : "false"); });
  }

  /* ---- sismo: muro solo frente a muro confinado ---------------------- */
  $$('[data-nm="sismo"]').forEach(function (fig) {
    var b = $("[data-sismo]", fig), estado = 0, t;
    b.addEventListener("click", function () {
      clearTimeout(t);
      if (estado) {
        fig.classList.remove("tiembla", "roto"); estado = 0; b.textContent = "Simular sismo"; return;
      }
      fig.classList.add("tiembla");
      t = setTimeout(function () { fig.classList.remove("tiembla"); fig.classList.add("roto"); }, quieto ? 0 : 900);
      estado = 1; b.textContent = "Reiniciar";
    });
  });

  /* ---- barras CAF: crecen al verse y explican cada pais --------------- */
  $$('[data-nm="barras"]').forEach(function (fig) {
    var lista = $(".nm-barras", fig), nota = $(".nm-barras-nota", fig);
    var items = $$("li", lista), base = 290;
    if (!quieto && "IntersectionObserver" in window) {
      lista.classList.add("oculto");
      var io = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { lista.classList.remove("oculto"); io.disconnect(); }
      }, { threshold: 0.25 });
      io.observe(lista);
    }
    function elige(li) {
      items.forEach(function (x) { x.classList.toggle("sel", x === li); x.setAttribute("aria-pressed", x === li); });
      var v = +li.dataset.usd, p = li.dataset.pais;
      nota.innerHTML = "<b>" + p + ": US$ " + num(v) + " por m².</b> Una casa de 60 m² rondaría los <b>US$ " +
        num(v * 60) + "</b> de construcción directa" +
        (v > base ? ", unas <b>" + (v / base).toFixed(1) + " veces</b> lo que costaría en Honduras." : ", el costo más bajo de la comparación.");
    }
    items.forEach(function (li) {
      li.tabIndex = 0; li.setAttribute("role", "button");
      li.addEventListener("click", function () { elige(li); });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elige(li); }
      });
    });
  });

  /* ---- calculadora de presupuesto (Tablas 8 y 9) ---------------------- */
  var COSTOS = {
    mx: { m: "MXN", r: [[7500, 9500], [10000, 13500], [14000, 22000]] },
    gt: { m: "GTQ", r: [[2900, 3900], [4000, 5800], [6000, 9500]] },
    cr: { m: "CRC", r: [[265000, 325000], [370000, 430000], [490000, 710000]] },
    co: { m: "COP", r: [[1850000, 2250000], [3100000, 3800000], null],
          n: ["obra gris", "terminada", ""] },
    pe: { m: "PEN", r: [[1400, 1800], [1900, 2400], [2400, 3800]], n: ["casco", "", ""] },
    cl: { m: "CLP", r: [[550000, 700000], [750000, 1000000], [1200000, null]] }
  };
  $$('[data-nm="calc"]').forEach(function (fig) {
    var pais = $("[name=pais]", fig), cal = $("[name=calidad]", fig), m2 = $("[name=m2]", fig);
    var out = {}; ["directo", "indirectos", "imprevistos", "total", "aviso"].forEach(function (k) { out[k] = $("[data-o=" + k + "]", fig); });
    function rango(a, b, mon) {
      if (b == null) return "desde " + num(a) + " " + mon;
      return num(a) + " – " + num(b) + " " + mon;
    }
    function calcula() {
      var c = COSTOS[pais.value], q = +cal.value, area = Math.max(10, Math.min(2000, +m2.value || 0));
      var r = c.r[q];
      if (!r) {
        ["directo", "indirectos", "imprevistos", "total"].forEach(function (k) { out[k].textContent = "—"; });
        out.aviso.textContent = "La tesis no da un rango para la calidad alta en Colombia: depende de los acabados.";
        return;
      }
      var a = r[0] * area, b = r[1] == null ? null : r[1] * area;
      out.directo.textContent = rango(a, b, c.m);
      out.indirectos.textContent = rango(a * 0.18, b == null ? null : b * 0.25, c.m);
      out.imprevistos.textContent = rango(a * 0.07, b == null ? null : b * 0.07, c.m);
      out.total.textContent = "≈ " + rango(a * 1.25, b == null ? null : b * 1.32, c.m);
      var nota = c.n && c.n[q] ? "El rango de este país corresponde a obra " + (c.n[q] === "obra gris" ? "gris" : c.n[q] === "casco" ? "en casco" : c.n[q]) + ". " : "";
      out.aviso.textContent = nota + "Sin terreno. Rangos de referencia de 2026: actualícelos con cotizaciones locales.";
    }
    [pais, cal, m2].forEach(function (x) { x.addEventListener("input", calcula); });
    calcula();
  });

  /* ---- vivienda por etapas ------------------------------------------ */
  $$('[data-nm="etapas"]').forEach(function (fig) {
    var r = $("input[type=range]", fig), txt = $("[data-o=etapa]", fig);
    var TXT = [
      "<b>Etapa 1 · Núcleo seguro.</b> Cimientos, estructura completa, baño, cocina y un espacio cerrado y seco. Las varillas de espera quedan protegidas.",
      "<b>Etapa 2 · Ampliación lateral.</b> Crece hacia el lado ya previsto en el plan maestro, con sus propias columnas y vigas conectadas al núcleo.",
      "<b>Etapa 3 · Segundo piso previsto.</b> Sube sobre cimientos y columnas que se diseñaron desde el inicio para cargarlo."
    ];
    if (fig.dataset.t1) TXT = [fig.dataset.t1, fig.dataset.t2, fig.dataset.t3];
    function pinta() {
      var n = +r.value;
      $$(".nm-etapa", fig).forEach(function (g) { g.classList.toggle("fuera", +g.dataset.etapa > n); });
      $$(".solo-hasta", fig).forEach(function (g) { g.style.opacity = n <= +g.dataset.hasta ? 1 : 0; });
      txt.innerHTML = TXT[n - 1];
      r.setAttribute("aria-valuetext", "Etapa " + n);
    }
    r.addEventListener("input", pinta); pinta();
  });

  /* ---- espectro visible -------------------------------------------- */
  function ondaRGB(w) {
    var r = 0, g = 0, b = 0;
    if (w < 440) { r = (440 - w) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; }
    else if (w < 510) { g = 1; b = (510 - w) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; }
    else if (w < 645) { r = 1; g = (645 - w) / 65; } else { r = 1; }
    var f = w < 420 ? 0.3 + 0.7 * (w - 380) / 40 : w > 700 ? 0.3 + 0.7 * (780 - w) / 80 : 1;
    function c(x) { return Math.round(255 * Math.pow(x * f, 0.8)); }
    return "rgb(" + c(r) + "," + c(g) + "," + c(b) + ")";
  }
  $$('[data-nm="espectro"]').forEach(function (fig) {
    var r = $("input[type=range]", fig), bola = $(".bola", fig), txt = $("[data-o=onda]", fig);
    function nombre(w) {
      return w < 450 ? "violeta" : w < 495 ? "azul" : w < 570 ? "verde" : w < 590 ? "amarillo" : w < 620 ? "naranja" : "rojo";
    }
    function pinta() {
      var w = +r.value, col = ondaRGB(w);
      bola.style.background = col; bola.style.setProperty("--bola", col);
      var extra = w >= 460 && w <= 500
        ? " Aquí está el pico de la <b>melanopsina</b> (≈ 480 nm): es la luz que más frena la melatonina."
        : w < 420 ? " Más corta que esto ya es ultravioleta: no la vemos." : w > 740 ? " Más larga que esto ya es infrarrojo: lo sentimos como calor." : "";
      txt.innerHTML = "<b>" + w + " nm · " + nombre(w) + "</b>." + extra;
      r.setAttribute("aria-valuetext", w + " nanómetros, " + nombre(w));
    }
    r.addEventListener("input", pinta); pinta();
  });

  /* ---- temperatura de color por habitacion (Figura 2 + Tabla 4) ------- */
  function kelvinRGB(k) {
    var t = k / 100, r, g, b;
    r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332);
    g = t <= 66 ? 99.47 * Math.log(t) - 161.12 : 288.12 * Math.pow(t - 60, -0.0755);
    b = t >= 66 ? 255 : t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
    function c(x) { return Math.max(0, Math.min(255, Math.round(x))); }
    return [c(r), c(g), c(b)];
  }
  var REF = [[1900, "una vela"], [2700, "un foco cálido"], [3500, "blanco cálido"], [4000, "luz neutra"],
             [5500, "el sol de mediodía"], [6500, "un cielo nublado"]];
  $$('[data-nm="kelvin"]').forEach(function (fig) {
    var r = $("input[type=range]", fig), luz = $(".luz", fig), chips = $$(".nm-chip", fig);
    var oK = $("[data-o=k]", fig), oS = $("[data-o=sensacion]", fig), oL = $("[data-o=lux]", fig), oN = $("[data-o=nota]", fig);
    function pinta(desdeChip) {
      // se suaviza hacia el blanco: el ojo se adapta y nunca ve el tono tan puro
      var k = +r.value, c = kelvinRGB(k).map(function (v) { return Math.round(255 - (255 - v) * 0.55); });
      luz.style.background = "rgb(" + c.join(",") + ")";
      oK.textContent = num(k) + " K";
      oS.textContent = k < 3000 ? "Cálida · relajante" : k < 4500 ? "Neutra · equilibrada" : "Fría · activadora";
      var cerca = REF.reduce(function (a, x) { return Math.abs(x[0] - k) < Math.abs(a[0] - k) ? x : a; });
      if (!desdeChip) {
        pulsar(chips, null);
        oL.textContent = "—";
        oN.innerHTML = "Se parece a <b>" + cerca[1] + "</b> (" + num(cerca[0]) + " K)." +
          (k >= 4500 ? " De noche, una luz así retrasa la melatonina." : "");
      }
      r.setAttribute("aria-valuetext", num(k) + " kelvin");
    }
    chips.forEach(function (b) {
      b.addEventListener("click", function () {
        r.value = b.dataset.k; pinta(true); pulsar(chips, b);
        oL.textContent = b.dataset.lux;
        oN.innerHTML = "<b>" + b.textContent + ":</b> " + b.dataset.rango + ". " + b.dataset.nota;
      });
    });
    r.addEventListener("input", function () { pinta(false); });
    pinta(false);
  });

  /* ---- reloj del cuerpo: melatonina y alerta ------------------------- */
  function campana(h, c, s) {
    var d = Math.abs(h - c); d = Math.min(d, 24 - d);
    return Math.exp(-(d * d) / (2 * s * s));
  }
  $$('[data-nm="reloj"]').forEach(function (fig) {
    var r = $("input[type=range]", fig), linea = $(".cursor", fig);
    var oH = $("[data-o=hora]", fig), oM = $("[data-o=mel]", fig), oA = $("[data-o=alerta]", fig), oC = $("[data-o=consejo]", fig);
    var x0 = +linea.dataset.x0, x1 = +linea.dataset.x1;
    function nivel(v) { return v > 0.66 ? "alta" : v > 0.3 ? "media" : "baja"; }
    function pinta() {
      var h = +r.value, x = x0 + (x1 - x0) * h / 24;
      linea.setAttribute("transform", "translate(" + x + " 0)");
      var mel = campana(h, 3, 3.2), al = 0.15 + 0.85 * campana(h, 14, 4.6);
      var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
      oH.textContent = (hh % 24 < 10 ? "0" : "") + (hh % 24) + ":" + (mm < 10 ? "0" : "") + mm;
      oM.textContent = nivel(mel); oA.textContent = nivel(al);
      oC.textContent =
        h < 6 ? "Oscuridad total para dormir: la melatonina está en su punto más alto." :
        h < 9 ? "Sal a la luz natural de la mañana, aunque sean 15 o 20 minutos: es la señal más poderosa para el reloj." :
        h < 17 ? "Luz abundante, natural o blanca y potente: ayuda a la alerta y a dormir mejor en la noche." :
        h < 20 ? "Al caer la tarde, baja la intensidad y pasa a luces cálidas y más bajas." :
        "Focos cálidos (2,700 K o menos), bajos y tenues. Menos pantallas antes de dormir.";
      r.setAttribute("aria-valuetext", oH.textContent + ", melatonina " + oM.textContent + ", alerta " + oA.textContent);
    }
    r.addEventListener("input", pinta); pinta();
  });

  /* ---- simulador 60-30-10 con las paletas de la Tabla 5 -------------- */
  $$('[data-nm="paletas"]').forEach(function (fig) {
    var chips = $$(".nm-chip", fig), info = $(".nm-paleta-info", fig), barra = $$(".nm-6030 span", fig);
    function luminancia(hex) {
      var n = parseInt(hex.slice(1), 16);
      return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    }
    function pinta(b) {
      var c = b.dataset.p.split(",");
      // 60 = base, 30 = secundario, 10 = acento (el mas vivo de la paleta)
      var mapa = { p60: c[0], p30: c[2], p30b: c[3], p10: c[1] };
      for (var k in mapa) $$("." + k, fig).forEach(function (e) { e.setAttribute("fill", mapa[k]); });
      [c[0], c[2], c[1]].forEach(function (col, i) {
        barra[i].style.background = col; barra[i].style.color = luminancia(col) > 0.55 ? "#221d12" : "#fff";
      });
      pulsar(chips, b);
      info.innerHTML = "<b>" + b.textContent + "</b> · " + b.dataset.obj + " · Luz: " + b.dataset.luz;
    }
    chips.forEach(function (b) { b.addEventListener("click", function () { pinta(b); }); });
    pinta(chips[0]);
  });

  /* =====================================================================
     Piezas de los ensayos "Temas de Arquitectura"
     ===================================================================== */

  /* ---- barras y cuadros que crecen al verse --------------------------- */
  $$("[data-nm-crece]").forEach(function (el) {
    if (quieto || !("IntersectionObserver" in window)) { el.classList.remove("oculto"); return; }
    var io = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { el.classList.remove("oculto"); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
  });

  /* ---- ladrillo: bloques y mortero para un muro ----------------------- */
  $$('[data-nm="muro"]').forEach(function (fig) {
    var m2 = $("[name=m2]", fig), chips = $$("[data-merma]", fig), merma = 0.05;
    var oB = $("[data-o=bloques]", fig), oS = $("[data-o=sacos]", fig), oC = $("[data-o=costo]", fig);
    function calcula() {
      var a = Math.max(0, Math.min(2000, +m2.value || 0));
      var b = Math.ceil(a * 12.5 * (1 + merma));
      oB.textContent = num(b) + " piezas";
      oS.textContent = "≈ " + num(Math.ceil(b * 3 / 100)) + " sacos";
      oC.textContent = num(b * 5) + " – " + num(b * 18) + " MXN";
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () { merma = +c.dataset.merma; pulsar(chips, c); calcula(); });
    });
    m2.addEventListener("input", calcula); calcula();
  });

  /* ---- ladrillo: masa termica ---------------------------------------- */
  function onda(h, amp, pico) { return 0.5 + 0.45 * amp * Math.cos((h - pico) / 24 * 2 * Math.PI); }
  $$('[data-nm="termica"]').forEach(function (fig) {
    var r = $("input[type=range]", fig), linea = $(".cursor", fig), out = $("[data-o=termica]", fig);
    var x0 = +linea.dataset.x0, x1 = +linea.dataset.x1;
    function pinta() {
      var h = +r.value, ext = onda(h, 1, 15), ad = onda(h, 0.35, 21);
      linea.setAttribute("transform", "translate(" + (x0 + (x1 - x0) * h / 24) + " 0)");
      var hh = Math.floor(h) % 24, txt = (hh < 10 ? "0" : "") + hh + ":" + (h % 1 ? "30" : "00") + " · ";
      txt += ext > 0.7 ? "Afuera hace calor. " : ext < 0.3 ? "Afuera hace frío. " : "Afuera está templado. ";
      txt += ad < ext - 0.12 ? "El adobe sigue fresco: todavía está guardando el calor del día. " :
             ad > ext + 0.12 ? "El adobe devuelve el calor que guardó: adentro está más tibio que afuera. " :
             "El adobe y el aire de afuera se parecen en este momento. ";
      txt += "El bloque hueco sin repello sigue casi igual a afuera.";
      out.textContent = txt;
      r.setAttribute("aria-valuetext", txt);
    }
    r.addEventListener("input", pinta); pinta();
  });

  /* ---- ladrillo: los colores del idioma ------------------------------ */
  $$('[data-nm="paleta-casa"]').forEach(function (fig) {
    var bs = $$(".nm-muestra-b", fig), muro = $(".muro-c rect", fig), pint = $(".pintura", fig), out = $("[data-o=paleta]", fig);
    function elige(b) {
      pulsar(bs, b);
      var c = b.dataset.c;
      if (c === "paint") { pint.setAttribute("opacity", "1"); }
      else { pint.setAttribute("opacity", "0"); muro.setAttribute("fill", c); }
      out.innerHTML = "<b>" + b.querySelector("b").textContent + ":</b> " + b.dataset.t;
    }
    bs.forEach(function (b) { b.addEventListener("click", function () { elige(b); }); });
    elige(bs[0]);
  });

  /* ---- color: el alero y el sol --------------------------------------- */
  $$('[data-nm="alero"]').forEach(function (fig) {
    var alt = $("[name=alt]", fig), vuelo = $("[name=vuelo]", fig), chips = $$("[data-alt]", fig), out = $("[data-o=alero]", fig);
    var alero = $(".alero", fig), sombra = $(".sombra", fig), rayo = $(".rayo", fig), sol = $(".sol", fig), piso = $(".luz-piso", fig);
    var MURO = 306, BAJO = 42, VS = 130, VI = 250, SUELO = 300;
    function pinta(desdeChip) {
      var a = +alt.value * Math.PI / 180, v = +vuelo.value, t = Math.tan(a);
      alero.setAttribute("width", 26 + v);
      var ys = Math.min(SUELO, BAJO + v * t), tip = MURO + v;
      sombra.setAttribute("height", Math.max(0, ys - 40));
      var d = Math.min(260, (BAJO - 18) / Math.sin(a) + 120);
      var sx = Math.min(600, tip + d * Math.cos(a)), sy = Math.max(18, BAJO - d * Math.sin(a));
      sol.setAttribute("cx", sx); sol.setAttribute("cy", sy);
      var yFin = Math.min(ys, SUELO), xFin = BAJO + v * t > SUELO ? tip - (SUELO - BAJO) / t : MURO;
      rayo.setAttribute("x1", sx); rayo.setAttribute("y1", sy); rayo.setAttribute("x2", xFin); rayo.setAttribute("y2", yFin);
      var arriba = Math.max(ys, VS), pts = "0,0";
      if (arriba < VI) {
        var f1 = Math.max(0, MURO - (SUELO - arriba) / t), f2 = Math.max(0, MURO - (SUELO - VI) / t);
        pts = MURO + "," + arriba + " " + MURO + "," + VI + " " + f2 + "," + SUELO + " " + f1 + "," + SUELO;
      }
      piso.setAttribute("points", pts);
      var somb = Math.round(Math.max(0, Math.min(1, (ys - VS) / (VI - VS))) * 100);
      out.innerHTML = "Sol a <b>" + alt.value + "°</b>, alero de <b>" + v + " cm</b>: la ventana queda <b>" + somb +
        " % en sombra</b>" + (somb >= 100 ? ". El sol no entra." : ". El sol entra y calienta el piso del cuarto.");
      if (!desdeChip) pulsar(chips, null);
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () { alt.value = c.dataset.alt; pinta(true); pulsar(chips, c); });
    });
    [alt, vuelo].forEach(function (x) { x.addEventListener("input", function () { pinta(false); }); });
    pinta(false);
  });

  /* ---- color: circulo cromatico -------------------------------------- */
  var ARMONIAS = {
    comp: [[0, 6], "Opuestos exactos en el círculo: el contraste más alto e impactante posible."],
    analogos: [[-1, 0, 1], "Vecinos cercanos: combinan con una afinidad casi automática y dan paletas serenas y cohesivas."],
    triada: [[0, 4, 8], "Tres colores equidistantes, sin que ninguno domine sobre los otros."],
    dividido: [[0, 5, 7], "En lugar del opuesto exacto, sus dos vecinos: un contraste casi tan vivo, con más margen de matiz."],
    tetrada: [[0, 2, 6, 8], "Doble complementario: el equilibrio de la tríada llevado a cuatro colores."]
  };
  $$('[data-nm="rueda"]').forEach(function (fig) {
    var sect = $$(".sector", fig), chips = $$("[data-a]", fig), enlace = $(".enlace", fig);
    var base = 4, arm = "comp", tira = $(".nm-tira", fig), out = $("[data-o=armonia]", fig), baseT = $(".base-t", fig);
    function centro(i) {
      var a = (i * 30 - 90) * Math.PI / 180;
      return (160 + 106 * Math.cos(a)).toFixed(1) + "," + (160 + 106 * Math.sin(a)).toFixed(1);
    }
    function pinta() {
      var idx = ARMONIAS[arm][0].map(function (o) { return (base + o + 12) % 12; });
      sect.forEach(function (s, i) { s.classList.toggle("off", idx.indexOf(i) < 0); s.classList.toggle("base", i === base); });
      enlace.setAttribute("points", idx.length > 1 ? idx.map(centro).join(" ") : "160,160");
      tira.innerHTML = idx.map(function (i) {
        var hx = parseInt(sect[i].getAttribute("fill").slice(1), 16);
        var claro = (0.299 * (hx >> 16) + 0.587 * ((hx >> 8) & 255) + 0.114 * (hx & 255)) > 150;
        return '<span style="background:' + sect[i].getAttribute("fill") + (claro ? ';color:#221d12;text-shadow:none' : '') + '">'  + sect[i].getAttribute("aria-label").split(" (")[0] + "</span>";
      }).join("");
      baseT.textContent = sect[base].getAttribute("aria-label").split(" (")[0];
      out.innerHTML = "<b>" + chips.filter(function (c) { return c.dataset.a === arm; })[0].textContent + ".</b> " + ARMONIAS[arm][1];
    }
    sect.forEach(function (s, i) {
      function elige() { base = i; pinta(); }
      s.addEventListener("click", elige);
      s.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elige(); } });
    });
    chips.forEach(function (c) { c.addEventListener("click", function () { arm = c.dataset.a; pulsar(chips, c); pinta(); }); });
    pinta();
  });

  /* ---- color: luz contra tinta ---------------------------------------- */
  $$('[data-nm="mezcla"]').forEach(function (fig) {
    var b = $("[data-mezcla]", fig);
    b.addEventListener("click", function () {
      var on = fig.classList.toggle("junto");
      b.textContent = on ? "Separar" : "Mezclar";
    });
    if (!quieto && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { setTimeout(function () { fig.classList.add("junto"); b.textContent = "Separar"; }, 600); io.disconnect(); }
      }, { threshold: 0.5 });
      io.observe(fig);
    }
  });

  /* ---- color: el mismo cuarto, tres intenciones ----------------------- */
  $$('[data-nm="percepcion"]').forEach(function (fig) {
    var chips = $$("[data-modo]", fig), out = $("[data-o=modo]", fig);
    function elige(c) {
      pulsar(chips, c);
      fig.setAttribute("data-modo", c.dataset.modo);
      $$(".pared", fig).forEach(function (p) { p.setAttribute("fill", c.dataset.pared); });
      ["fondo", "techo", "piso", "luz"].forEach(function (k) { $("." + k, fig).setAttribute("fill", c.dataset[k]); });
      out.innerHTML = "<b>" + c.textContent + ":</b> " + c.dataset.txt;
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { elige(c); }); });
    elige(chips[0]);
  });

  /* ---- minimalista: dos casas bajo el mismo tropico -------------------- */
  var TROPICO = {
    "min-sol": "El vidrio sin protección solar convierte el interior en un invernadero, y el concreto pulido absorbe el calor y lo irradia hacia adentro.",
    "min-lluvia": "Con lluvias que pueden superar los 100 mm en pocas horas, la cubierta plana sin pendiente acumula agua y genera filtraciones.",
    "min-hum": "Con humedad a menudo superior al 80 %, el muro blanco perfectamente liso se mancha y se deteriora en meses.",
    "ver-sol": "El alero generoso y el corredor dan sombra a las fachadas; la celosía deja pasar el aire y bloquea la radiación.",
    "ver-lluvia": "La cubierta inclinada de teja escurre el agua y el alero protege los muros de la lluvia.",
    "ver-hum": "La celosía y el patio, que funciona como chimenea térmica, mantienen el aire cruzando la casa."
  };
  $$('[data-nm="tropico"]').forEach(function (fig) {
    var cs = $$("[data-casa]", fig), es = $$("[data-ef]", fig), out = $("[data-o=tropico]", fig);
    var casa = "min", ef = "sol";
    function pinta() {
      fig.setAttribute("data-casa", casa); fig.setAttribute("data-efecto", ef);
      out.textContent = TROPICO[casa + "-" + ef];
    }
    cs.forEach(function (c) { c.addEventListener("click", function () { casa = c.dataset.casa; pulsar(cs, c); pinta(); }); });
    es.forEach(function (c) { c.addEventListener("click", function () { ef = c.dataset.ef; pulsar(es, c); pinta(); }); });
    pinta();
  });

  /* ---- minimalista: mantenimiento ------------------------------------ */
  $$('[data-nm="mant"]').forEach(function (fig) {
    var r = $("input[type=range]", fig), manchas = $(".manchas", fig), brocha = $(".brocha", fig);
    var oA = $("[data-o=anos]", fig), oP = $("[data-o=pintar]", fig), oR = $("[data-o=revision]", fig);
    function pinta() {
      var y = +r.value, ciclo = y % 2.5;
      manchas.setAttribute("opacity", (ciclo / 2.5).toFixed(2));
      brocha.setAttribute("opacity", y > 0 && ciclo < 0.5 ? 1 : 0);
      var a = Math.floor(y / 3), b = Math.floor(y / 2);
      oA.textContent = String(y).replace(".5", " ½");
      oP.textContent = a === b ? String(a) : a + " a " + b;
      oR.textContent = String(Math.floor(y));
      r.setAttribute("aria-valuetext", y + " años: pintar " + oP.textContent + " veces");
    }
    r.addEventListener("input", pinta); pinta();
  });

  /* ---- minimalista: Quinta Monroy ------------------------------------ */
  $$('[data-nm="monroy"]').forEach(function (fig) {
    var r = $("input[type=range]", fig), out = $("[data-o=monroy]", fig), rel = $$(".relleno", fig);
    function pinta() {
      var n = +r.value;
      rel.forEach(function (g) { g.classList.toggle("on", +g.dataset.n < n); });
      out.innerHTML = n === 0
        ? "<b>El día de la entrega:</b> estructura, baño, cocina y escalera. La otra mitad queda vacía, a propósito."
        : "<b>" + n + (n === 1 ? " familia completó" : " familias completaron") + " su mitad</b>, a su ritmo y con su color.";
    }
    r.addEventListener("input", pinta); pinta();
  });

  /* ---- patio: anatomia de la casa ------------------------------------ */
  $$('[data-nm="anatomia"]').forEach(function (fig) {
    var zonas = $$(".zona", fig), visita = $(".visita", fig), b = $("[data-recorrer]", fig);
    var oN = $("[data-o=zn]", fig), oT = $("[data-o=zt]", fig), t;
    var C = { calle: [22, 160], zaguan: [99, 160], sala: [99, 78], cuartos: [99, 242], patio: [274, 160], segundo: [479, 190], traspatio: [632, 150] };
    function elige(z) {
      zonas.forEach(function (g) { g.classList.toggle("sel", g.dataset.z === z); });
      var g = zonas.filter(function (x) { return x.dataset.z === z; })[0];
      oN.textContent = g.dataset.n; oT.textContent = g.dataset.t;
      var c = C[z];
      visita.setAttribute("transform", "translate(" + (c[0] - 22) + " " + (c[1] - 160) + ")");
    }
    zonas.forEach(function (g) {
      g.addEventListener("click", function () { clearTimeout(t); elige(g.dataset.z); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clearTimeout(t); elige(g.dataset.z); } });
    });
    b.addEventListener("click", function () {
      var ruta = ["calle", "zaguan", "patio", "segundo", "traspatio"], i = 0;
      clearTimeout(t);
      (function paso() { elige(ruta[i]); i++; if (i < ruta.length) t = setTimeout(paso, quieto ? 600 : 1700); })();
    });
  });

  /* ---- patio: la fisica del frescor ---------------------------------- */
  $$('[data-nm="fisica"]').forEach(function (fig) {
    var chips = $$("[data-ef]", fig), out = $("[data-o=fisica]", fig);
    function elige(c) {
      pulsar(chips, c); fig.setAttribute("data-efecto", c.dataset.ef);
      out.innerHTML = "<b>" + c.textContent + ".</b> " + c.dataset.t;
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { elige(c); }); });
    elige(chips[0]);
  });

  /* ---- patio: aljibe, pozo y pila ------------------------------------ */
  var PIEZAS_AGUA = {
    aljibe: "<b>Aljibe:</b> no busca agua bajo tierra, guarda la que cae del cielo. Canales y bajantes la llevan del techo a un decantador y a una cisterna abovedada bajo el patio; se saca por el brocal.",
    pozo: "<b>Pozo:</b> perfora hacia abajo hasta encontrar la napa freática y capta agua subterránea de un acuífero.",
    pila: "<b>Pila o fuente:</b> es solo la salida visible del agua, venga de un pozo, de un aljibe o de la red. Punto de encuentro y señal de prestigio."
  };
  $$('[data-nm="aljibe"]').forEach(function (fig) {
    var chips = $$("[data-pz]", fig), out = $("[data-o=aljibe]", fig), agua = $(".agua", fig), b = $("[data-llover]", fig);
    var nivel = 0.15, t;
    function llena() { var h = 88 * nivel; agua.setAttribute("y", 336 - h); agua.setAttribute("height", h); }
    function elige(c) { pulsar(chips, c); fig.setAttribute("data-pz", c.dataset.pz); out.innerHTML = PIEZAS_AGUA[c.dataset.pz]; }
    chips.forEach(function (c) { c.addEventListener("click", function () { elige(c); }); });
    b.addEventListener("click", function () {
      elige(chips[0]); fig.classList.add("llueve"); clearTimeout(t);
      nivel = nivel >= 0.95 ? 0.15 : Math.min(1, nivel + 0.28); llena();
      t = setTimeout(function () { fig.classList.remove("llueve"); }, 2600);
    });
    elige(chips[0]); llena();
  });

  /* ---- patio: tu techo como aljibe ----------------------------------- */
  $$('[data-nm="lluvia"]').forEach(function (fig) {
    var techo = $("[name=techo]", fig), mm = $("[name=mm]", fig), out = $("[data-o=litros]", fig);
    function calcula() {
      var l = Math.max(0, +techo.value || 0) * Math.max(0, +mm.value || 0);
      out.textContent = "≈ " + num(l) + " litros · " + num(l / 1000) + " m³";
    }
    [techo, mm].forEach(function (x) { x.addEventListener("input", calcula); }); calcula();
  });
})();
