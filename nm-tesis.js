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
})();
