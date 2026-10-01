/* ==========================================================================
   NO MINIMAL — capa comun de los ensayos.
   Construye el indice a partir de los capitulos, marca el progreso de
   lectura y ofrece los otros ensayos al final. No toca el texto: solo
   agrega piezas alrededor.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document.querySelector("article.doc");
  if (!doc) return;
  var body = document.body;
  var tema = body.getAttribute("data-tema") || "";
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)");

  var ENSAYOS = [
    { id: "ladrillo", url: "ladrillo.html", t: "El ladrillo como lengua materna",
      s: "El bloque, el tolete y el tabique: el idioma con que construimos nuestras casas.",
      min: 19, p: "greca", c: "#c0381c", f: "#611607" },
    { id: "color", url: "color.html", t: "Color, luz y sombra",
      s: "La luz nunca es neutral y el color nunca es solo decoración.",
      min: 57, p: "talavera", c: "#e5147d", f: "#0c1c56" },
    { id: "minimalista", url: "minimalista.html", t: "Por qué América Latina no puede ser minimalista",
      s: "Historia, clima, cultura y economía de una arquitectura propia.",
      min: 27, p: "chakana", c: "#0f4bd1", f: "#0c1c56" },
    { id: "patio", url: "patio.html", t: "Sombra, agua y patio",
      s: "El vacío central, el agua y la sombra como un solo sistema.",
      min: 45, p: "rombos", c: "#12b6ad", f: "#08222e" },
    { id: "construir", url: "construir.html", t: "Construir bien en Latinoamérica", serie: "tesis",
      s: "Terreno, materiales, costos y autoconstrucción: una guía para construir mejor.",
      min: 41, p: "celosia", c: "#3f7d4a", f: "#1f2b26" },
    { id: "psicologia", url: "psicologia-del-color.html", t: "Lo que el color nos hace", serie: "tesis",
      s: "Lo comprobado y lo exagerado sobre el color y la luz en el cuerpo, la mente y la casa.",
      min: 53, p: "mola", c: "#c8102e", f: "#1d1a17" }
  ];
  ENSAYOS.forEach(function (e) { e.serie = e.serie || "temas"; });

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function slug(t) {
    return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }

  /* ---- 1. Capitulos -------------------------------------------------- */
  // Si el ensayo marca sus capitulos con un antetitulo (p.eyb), solo esos
  // son capitulos; los demas h2 son subtitulos dentro del capitulo.
  var h2s = [].slice.call(doc.querySelectorAll("h2"));
  var conAntetitulo = h2s.filter(function (h) {
    var a = h.previousElementSibling;
    return a && a.classList.contains("eyb");
  });
  var capitulos = conAntetitulo.length >= 3 ? conAntetitulo : h2s;

  capitulos = capitulos.map(function (h, i) {
    if (!h.id) h.id = (slug(h.textContent) || "capitulo") + "-" + (i + 1);
    var ante = h.previousElementSibling;
    var ojo = "", titulo = h.textContent.trim();
    if (ante && ante.classList.contains("eyb")) {
      ojo = ante.textContent.trim();
    } else {
      // "Capitulo IV — Anatomia de la casa" -> antetitulo + titulo
      var m = titulo.match(/^((?:Cap[ií]tulo\s+[IVXLC]+)|Introducci[oó]n|Conclusi[oó]n(?:es)?|Referencias[^—:]*|Fuentes[^—:]*)\s*[—–:\-]?\s*(.*)$/i);
      if (m) { ojo = m[1]; titulo = m[2] || m[1]; if (!m[2]) ojo = ""; }
    }
    return { h: h, ancla: (ante && ante.classList.contains("eyb")) ? ante : h, ojo: ojo, titulo: titulo };
  });

  /* ---- 2. Bandas tejidas entre capitulos ----------------------------- */
  capitulos.forEach(function (c, i) {
    if (i === 0) return;
    c.ancla.parentNode.insertBefore(el("div", { "class": "nm-banda", "aria-hidden": "true" }), c.ancla);
  });

  /* ---- 3. Letra capital en el primer parrafo de verdad ---------------- */
  var parrafos = [].slice.call(doc.querySelectorAll("p"));
  for (var i = 0; i < parrafos.length; i++) {
    var p = parrafos[i];
    if (!p.classList.contains("eyb") && p.textContent.trim().length > 140 &&
        /^[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(p.textContent.trim())) {
      p.classList.add("nm-capitular");
      break;
    }
  }

  /* ---- 4. Tiempo de lectura bajo el autor ---------------------------- */
  // las figuras interactivas no se leen como texto: no cuentan
  function cuenta(n) { return (n.innerText || n.textContent).split(/\s+/).filter(Boolean).length; }
  var palabras = cuenta(doc);
  [].forEach.call(doc.querySelectorAll("figure.nm-fig"), function (f) { palabras -= cuenta(f); });
  var minutos = Math.max(1, Math.round(palabras / 220));
  var fila = document.querySelector(".hero-wrap > div:last-child");
  if (fila) {
    fila.appendChild(el("span", { "class": "nm-lectura" },
      "<b>≈ " + minutos + " min</b> de lectura · " + capitulos.length + " capítulos"));
  }

  /* ---- 5. Indice ----------------------------------------------------- */
  var progreso = el("div", { id: "nm-progreso", "aria-hidden": "true" });
  var velo = el("div", { id: "nm-velo", "aria-hidden": "true" });
  var lista = capitulos.map(function (c) {
    return '<li><a href="#' + c.h.id + '">' + (c.ojo ? '<span class="ojo">' + c.ojo + "</span>" : "") +
      c.titulo + "</a></li>";
  }).join("");
  var indice = el("nav", { id: "nm-indice", "aria-label": "Índice de capítulos" },
    '<div class="nm-ind-cab"><strong>Índice <span>· ' + capitulos.length + "</span></strong>" +
    '<button type="button" class="nm-ind-cerrar" aria-label="Cerrar índice">×</button></div>' +
    "<ol>" + lista + "</ol>");
  var boton = el("button", { id: "nm-indice-btn", type: "button", "aria-controls": "nm-indice",
    "aria-expanded": "false" }, '<span class="ico" aria-hidden="true"></span>Índice <small></small>');
  var arriba = el("button", { id: "nm-arriba", type: "button", "aria-label": "Volver al inicio del ensayo" },
    '<svg viewBox="0 0 60 60" aria-hidden="true" fill="currentColor">' +
    '<path d="M24 0h12v12h12v12h12v12H48v12H36v12H24V48H12V36H0V24h12V12h12z"/></svg>');
  [progreso, velo, indice, boton, arriba].forEach(function (n) { body.appendChild(n); });

  var enlaces = [].slice.call(indice.querySelectorAll("a"));
  var contador = boton.querySelector("small");

  function abrir() {
    indice.classList.add("abierto"); velo.classList.add("abierto");
    boton.setAttribute("aria-expanded", "true");
    var activo = indice.querySelector("a.activo") || enlaces[0];
    if (activo) {
      activo.scrollIntoView({ block: "center" });
      activo.focus({ preventScroll: true });
    }
  }
  function cerrar(devolver) {
    indice.classList.remove("abierto"); velo.classList.remove("abierto");
    boton.setAttribute("aria-expanded", "false");
    if (devolver) boton.focus();
  }
  boton.addEventListener("click", abrir);
  velo.addEventListener("click", function () { cerrar(true); });
  indice.querySelector(".nm-ind-cerrar").addEventListener("click", function () { cerrar(true); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && indice.classList.contains("abierto")) cerrar(true);
  });
  enlaces.forEach(function (a) { a.addEventListener("click", function () { cerrar(false); }); });
  arriba.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: quieto.matches ? "auto" : "smooth" });
  });

  /* ---- 6. Un solo lazo de scroll para todo --------------------------- */
  var actual = -1, pendiente = false;
  function pinta() {
    pendiente = false;
    var y = window.pageYOffset, vh = window.innerHeight;
    var total = document.documentElement.scrollHeight - vh;
    progreso.style.width = (total > 0 ? (y / total) * 100 : 0) + "%";

    var cajaDoc = doc.getBoundingClientRect();
    var dentro = cajaDoc.top < vh * 0.6 && cajaDoc.bottom > vh * 0.4;
    boton.classList.toggle("se-ve", dentro);
    indice.classList.toggle("fijo", dentro);
    arriba.classList.toggle("se-ve", y > vh * 1.2);

    // capitulo actual: el ultimo cuyo titulo ya paso el tercio superior
    var n = 0;
    for (var i = 0; i < capitulos.length; i++) {
      if (capitulos[i].ancla.getBoundingClientRect().top < vh * 0.34) n = i; else break;
    }
    if (n !== actual) {
      actual = n;
      enlaces.forEach(function (a, j) {
        a.classList.toggle("activo", j === n);
        if (j === n) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
      contador.textContent = (n + 1) + "/" + capitulos.length;
      // en escritorio, que el capitulo activo no se pierda de vista en la columna
      if (indice.classList.contains("fijo") && !indice.classList.contains("abierto")) {
        var a = enlaces[n], cajaI = indice.getBoundingClientRect(), cajaA = a.getBoundingClientRect();
        if (cajaA.top < cajaI.top + 60 || cajaA.bottom > cajaI.bottom - 10) {
          indice.scrollTop += cajaA.top - cajaI.top - cajaI.height / 3;
        }
      }
    }
  }
  function alScroll() { if (!pendiente) { pendiente = true; requestAnimationFrame(pinta); } }
  window.addEventListener("scroll", alScroll, { passive: true });
  window.addEventListener("resize", alScroll, { passive: true });
  pinta();

  /* ---- 7. Sigue leyendo ---------------------------------------------- */
  // Tres tarjetas: hasta dos de la misma serie y al menos una de la otra,
  // para que cada lector descubra la otra mitad de la biblioteca.
  var yo = ENSAYOS.filter(function (e) { return e.id === tema; })[0] || { serie: "temas" };
  var misma = ENSAYOS.filter(function (e) { return e.id !== tema && e.serie === yo.serie; });
  var otra = ENSAYOS.filter(function (e) { return e.serie !== yo.serie; });
  var giro = ENSAYOS.indexOf(yo) % Math.max(1, otra.length);
  otra = otra.slice(giro).concat(otra.slice(0, giro));
  var otros = misma.slice(0, 2).concat(otra).slice(0, 3);
  var tarjetas = otros.map(function (e) {
    return '<a class="nm-tarjeta" href="' + e.url + '" style="--c:' + e.c + ";--f:" + e.f +
      ";--p:var(--pat-" + e.p + ')">' +
      '<div class="arcada" aria-hidden="true"><span></span></div>' +
      '<div class="cuerpo"><span class="serie">' + (e.serie === "tesis" ? "Tesis de divulgación" : "Temas de Arquitectura") +
      "</span><h3>" + e.t + "</h3><p>" + e.s + "</p>" +
      '<div class="meta"><span>≈ ' + e.min + " min</span><b>Leer →</b></div></div></a>";
  }).join("");
  var sigue = el("section", { "class": "nm-sigue", "aria-labelledby": "nm-sigue-t" },
    '<div class="nm-sigue-cab"><p>No Minimal · la serie completa</p>' +
    '<h2 id="nm-sigue-t">Sigue leyendo</h2></div><div class="nm-tarjetas">' + tarjetas + "</div>");
  doc.parentNode.insertBefore(sigue, doc.nextSibling);
})();
