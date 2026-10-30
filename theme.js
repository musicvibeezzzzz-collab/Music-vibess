(function() {
    if (window.__vibeThemeLoaded) return;
    window.__vibeThemeLoaded = true;

    /* data-shell = app.html owns the music player
       data-font-only = font + photo helper only
       data-nomini = keep playback, hide mini player */
    var self = document.currentScript;
    var shell = !!(self && self.hasAttribute("data-shell"));
    var fontOnly = !!(self && self.hasAttribute("data-font-only"));
    var miniOn = !(self && self.hasAttribute("data-nomini"));

    var framed = false;
    if (!shell) {
      try { framed = window.parent !== window && !!window.parent.__vibeShell; } catch (e) { framed = false; }
    }

    if (!shell && !framed && window.parent === window) {
      var thisFile = location.pathname.split("/").pop();
      if (/\.html$/i.test(thisFile) && thisFile.toLowerCase() !== "app.html") {
        location.replace("app.html?page=" + encodeURIComponent(thisFile + location.search + location.hash));
        return;
      }
    }

    /* ===================== THEME ===================== */
    var KEY = "vibeTheme";
    var lightQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;

    function getVibeTheme() {
      try {
        var v = localStorage.getItem(KEY);
        return (v === "dark" || v === "light" || v === "system") ? v : "system";
      } catch (e) { return "system"; }
    }

    function resolve(choice) {
      if (choice === "system") return (lightQuery && lightQuery.matches) ? "light" : "dark";
      return choice;
    }

    function apply() {
      if (fontOnly) return;
      var theme = resolve(getVibeTheme());
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.style.colorScheme = theme;
    }

    function setVibeTheme(choice) {
      try { localStorage.setItem(KEY, choice); } catch (e) {}
      apply();
    }

    window.getVibeTheme = getVibeTheme;
    window.setVibeTheme = setVibeTheme;

    /* ===================== FONT + COLORS ===================== */
    var FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    var L = 'html[data-theme="light"] ';

    var lightCss = [
      L + 'body{background:#f4f4f4 !important;background-image:none !important;color:#171717 !important;}',
      L + 'body > h1,' + L + 'body > h3,' + L + '#recentTitle,' + L + '#one h3,' + L + '.settings h1,' + L + '.theme h1,' + L + '.arrow h1,' + L + '.genreHeader h1,' + L + '.genreHeader p,' + L + '.header .title,' + L + '.notification h1{color:#171717 !important;}',
      L + '.para{color:#171717 !important;}',
      L + '.description,' + L + '.status,' + L + '#status,' + L + '#message{color:#444 !important;}',
      L + '.backBtn{color:#171717 !important;}',
      L + '.profile,' + L + '.na .notification,' + L + '.on,' + L + '.About,' + L + '.pt .theme,' + L + '.na .theme,' + L + '.dark,' + L + '.email,' + L + '.password,' + L + '.picture{background-color:#e5e5e5 !important;color:#171717 !important;border-color:#cfcfcf !important;}',
      L + '.profile:hover,' + L + '.na .notification:hover,' + L + '.About:hover,' + L + '.pt .theme:hover,' + L + '.na .theme:hover{background-color:#E73C3C !important;color:#fff !important;}',
      L + '.email input,' + L + '.password input{color:#171717 !important;}',
      L + '.button button,' + L + 'body > center > button{background-color:#e5e5e5 !important;color:#E73C3C !important;}',
      L + '.slider{background-color:#bdbdbd !important;}',
      L + '.song-card,' + L + '.songCard{background:#ffffff !important;border-color:rgba(0,0,0,.12) !important;color:#171717 !important;}',
      L + '.song-title,' + L + '.song-artist,' + L + '.songTitle,' + L + '.songArtist{color:#171717 !important;}',
      L + '.genreHeader{background:none !important;}',
      L + '#noRecent,' + L + '#loading,' + L + '#noSongs{color:#444 !important;}',
      L + '#down{background:#e5e5e5 !important;}'
    ].join("\n");

    var css = '*{font-family:' + FONT + ' !important;}';
    if (!fontOnly) css += "\n" + lightCss;

    var style = document.createElement("style");
    style.id = "vibe-theme-style";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);

    apply();

    if (lightQuery && !fontOnly) {
      if (lightQuery.addEventListener) lightQuery.addEventListener("change", apply);
      else if (lightQuery.addListener) lightQuery.addListener(apply);
    }

    window.addEventListener("storage", function(e) {
      if (e.key === KEY) apply();
    });

    setTimeout(function() {
      document.documentElement.style.visibility = "visible";
    }, 5000);

    /* ===================== PROFILE PHOTO HELPER ===================== */
    var AV_KEY = "vibeAvatar";

    function avRead() {
      try { return JSON.parse(localStorage.getItem(AV_KEY)) || null; } catch (e) { return null; }
    }

    function avWrite(path, ver, data) {
      try { localStorage.setItem(AV_KEY, JSON.stringify({ path: path, ver: String(ver || ""), data: data })); } catch (e) {}
    }

    function avClear() {
      try { localStorage.removeItem(AV_KEY); } catch (e) {}
    }

    function loadImg(src) {
      return new Promise(function(resolve, reject) {
        var im = new Image();
        im.onload = function() { resolve(im); };
        im.onerror = function() { reject(new Error("Could not read image")); };
        im.src = src;
      });
    }

    function drawSquare(im, size) {
      var s = Math.min(im.naturalWidth, im.naturalHeight);
      var sx = (im.naturalWidth - s) / 2;
      var sy = (im.naturalHeight - s) / 2;
      var c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(im, sx, sy, s, s, 0, 0, size, size);
      return c;
    }

    function prepare(file) {
      var url = URL.createObjectURL(file);
      return loadImg(url)
        .then(function(im) {
          var s = Math.min(im.naturalWidth, im.naturalHeight);
          var big = drawSquare(im, Math.min(512, s));
          var thumb = drawSquare(im, Math.min(256, s)).toDataURL("image/jpeg", 0.85);
          return new Promise(function(resolve, reject) {
            big.toBlob(function(blob) {
              if (!blob) { reject(new Error("Could not process image")); return; }
              resolve({ blob: blob, thumb: thumb, ext: "jpg", type: "image/jpeg" });
            }, "image/jpeg", 0.88);
          });
        })
        .catch(function() {
          var ext = ((file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "")) || "jpg";
          return { blob: file, thumb: null, ext: ext, type: file.type || "image/jpeg" };
        })
        .then(function(result) {
          URL.revokeObjectURL(url);
          return result;
        });
    }

    function showCached(img) {
      if (!img) return;
      if (!img.dataset.def) img.dataset.def = img.getAttribute("src") || "";
      var c = avRead();
      if (c && c.data) img.src = c.data;
    }

    async function sync(client, bucket, path, ver, img) {
      if (img && !img.dataset.def) img.dataset.def = img.getAttribute("src") || "";
      if (!path) {
        avClear();
        if (img && img.dataset.def) img.src = img.dataset.def;
        return;
      }

      var c = avRead();
      if (c && c.path === path && c.ver === String(ver || "") && c.data) {
        if (img) img.src = c.data;
        return;
      }

      var url = null;
      try {
        var signed = await client.storage.from(bucket).createSignedUrl(path, 3600);
        url = (signed.data && signed.data.signedUrl) ||
          client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      } catch (e) { return; }

      if (img && url) img.src = url;

      try {
        var res = await fetch(url);
        var blob = await res.blob();
        var obj = URL.createObjectURL(blob);
        var im = await loadImg(obj);
        var s = Math.min(im.naturalWidth, im.naturalHeight);
        avWrite(path, ver, drawSquare(im, Math.min(256, s)).toDataURL("image/jpeg", 0.85));
        URL.revokeObjectURL(obj);
      } catch (e) {}
    }

    function remember(path, ver, thumb) {
      if (thumb) avWrite(path, ver, thumb);
      else avClear();
    }

    window.VibeAvatar = {
      prepare: prepare,
      showCached: showCached,
      sync: sync,
      remember: remember,
      clear: avClear
    };

    /* ===================== MUSIC PLAYER ===================== */
    if (shell) initPlayer();
    else if (framed) initProxy();
    else if (!fontOnly) initPlayer();

    function initProxy() {
      var shellWin = window.parent;
      window.VibePlayer = shellWin.VibePlayer;

      document.addEventListener("click", function(e) {
        var a = (e.target && e.target.closest) ? e.target.closest("a[href]") : null;
        if (!a) return;
        try {
          var u = new URL(a.href, location.href);
          if (/^https?:$/.test(u.protocol) && u.origin !== location.origin) a.target = "_top";
        } catch (err) {}
      }, true);

      ["pointerdown", "touchstart", "click", "keydown"].forEach(function(name) {
        document.addEventListener(name, function() {
          try { shellWin.__vibeShell.tap(); } catch (err) {}
        }, true);
      });

      function attach() {
        try {
          window.__vibeAttached = true;
          shellWin.__vibeShell.attach(window, miniOn && !fontOnly);
        } catch (err) {}
      }

      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach);
      else attach();
    }

    function initPlayer() {
      var PKEY = "vibePlayerState";
      var RKEY = "vibeRecentlyPlayed";
      var PLAY = '<path d="M8 5v14l11-7z"/>';
      var PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';

      var audio = new Audio();
      audio.preload = "auto";

      var song = null;
      var list = [];
      var built = false;
      var wantResume = false;
      var leaving = false;
      var lastSave = 0;
      var uiId = null;
      var host = null;
      var root = null;
      var spacer = null;
      var child = null;
      var childMini = false;

      function $(id) { return root.getElementById(id); }
      function same(a, b) { return !!(a && b && String(a.id) === String(b.id)); }
      function clone(v) {
        try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; }
      }

      function fmt(s) {
        if (!isFinite(s) || s < 0) return "0:00";
        var m = Math.floor(s / 60);
        var r = Math.floor(s % 60);
        return m + ":" + (r < 10 ? "0" : "") + r;
      }

      function pRead() {
        try { return JSON.parse(localStorage.getItem(PKEY)) || null; } catch (e) { return null; }
      }

      function pSave(force) {
        if (!song || leaving) return;
        var now = Date.now();
        if (!force && now - lastSave < 1000) return;
        lastSave = now;
        try {
          localStorage.setItem(PKEY, JSON.stringify({
            song: song,
            list: list.slice(0, 100),
            time: audio.currentTime || 0,
            playing: !audio.paused,
            volume: audio.volume,
            at: now
          }));
        } catch (e) {}
      }

      function addRecent(s) {
        try {
          var r = JSON.parse(localStorage.getItem(RKEY)) || [];
          r = r.filter(function(x) { return String(x.id) !== String(s.id); });
          r.unshift(s);
          localStorage.setItem(RKEY, JSON.stringify(r.slice(0, 10)));
        } catch (e) {}
      }

      function emit() {
        var detail = { songId: song ? song.id : null, playing: !audio.paused };
        try { window.dispatchEvent(new CustomEvent("vibeplayer", { detail: detail })); } catch (e) {}
        if (shell && child) {
          try { child.dispatchEvent(new child.CustomEvent("vibeplayer", { detail: detail })); } catch (e) {}
        }
      }

      function media() {
        if (!("mediaSession" in navigator) || !song) return;
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title || "Unknown Song",
            artist: song.artist || "Unknown Artist",
            artwork: song.cover_url ? [{ src: song.cover_url, sizes: "512x512" }] : []
          });
        } catch (e) {}
      }

      try {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.setActionHandler("play", function() { resume(); });
          navigator.mediaSession.setActionHandler("pause", function() { pause(); });
          navigator.mediaSession.setActionHandler("previoustrack", function() { prev(); });
          navigator.mediaSession.setActionHandler("nexttrack", function() { step(1); });
        }
      } catch (e) {}

      function load(s, autoplay, start) {
        song = s;
        audio.src = s.audio_url;
        audio.load();

        if (start > 0) {
          var f = function() {
            try { audio.currentTime = start; } catch (e) {}
            audio.removeEventListener("loadedmetadata", f);
          };
          audio.addEventListener("loadedmetadata", f);
        }

        if (autoplay) {
          var p = audio.play();
          if (p && p.catch) p.catch(function() { wantResume = true; ui(); emit(); });
        }

        media();
        ui();
        emit();
      }

      function resume() {
        if (!song) return;
        wantResume = false;
        var p = audio.play();
        if (p && p.catch) p.catch(function() { wantResume = true; });
      }

      function pause() {
        wantResume = false;
        audio.pause();
      }

      function stop() {
        song = null;
        list = [];
        uiId = null;
        wantResume = false;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        try { localStorage.removeItem(PKEY); } catch (e) {}
        if (built) close();
        ui();
        emit();
      }

      function idx() {
        for (var i = 0; i < list.length; i++) if (same(list[i], song)) return i;
        return 0;
      }

      function step(off) {
        if (!song) return;
        if (!list.length) list = [song];
        var n = (idx() + off + list.length) % list.length;
        var s = list[n];

        if (same(s, song)) {
          audio.currentTime = 0;
          resume();
        } else {
          addRecent(s);
          load(s, true, 0);
        }
        pSave(true);
      }

      function prev() {
        if (audio.currentTime > 3) audio.currentTime = 0;
        else step(-1);
      }

      function inList(s) {
        for (var i = 0; i < list.length; i++) if (same(list[i], s)) return true;
        return false;
      }

      function play(s, newList, openCard) {
        if (!s) return;
        s = clone(s);
        if (newList && newList.length) newList = clone(newList);
        if (newList && newList.length) list = newList.slice();
        else if (!list.length || !inList(s)) list = [s];

        if (same(song, s) && audio.src) {
          if (audio.paused) resume();
        } else {
          addRecent(s);
          load(s, true, 0);
        }

        pSave(true);
        if (openCard !== false) open();
      }

      function toggle(s, newList) {
        if (same(song, s) && audio.src) {
          if (audio.paused) resume();
          else pause();
          return;
        }
        play(s, newList, false);
      }

      function restore() {
        var saved = pRead();
        if (!saved || !saved.song || !saved.song.audio_url) return;
        list = (saved.list && saved.list.length) ? saved.list : [saved.song];
        var elapsed = saved.at ? Math.max(0, (Date.now() - saved.at) / 1000) : 0;
        var fresh = saved.at && elapsed < 30;
        var start = (saved.time || 0) + ((saved.playing && fresh) ? elapsed : 0);
        load(saved.song, !!(saved.playing && fresh), start);
      }

      audio.addEventListener("play", function() { wantResume = false; ui(); emit(); pSave(true); });
      audio.addEventListener("pause", function() { ui(); emit(); pSave(true); });
      audio.addEventListener("loadedmetadata", function() {
        if (built && song) $("total").textContent = fmt(audio.duration);
      });
      audio.addEventListener("timeupdate", function() { prog(); pSave(false); });
      audio.addEventListener("ended", function() { step(1); });

      function leave() {
        pSave(true);
        leaving = true;
      }

      window.addEventListener("pagehide", leave);
      window.addEventListener("beforeunload", leave);
      window.addEventListener("pageshow", function(e) {
        if (!e.persisted) return;
        leaving = false;
        if (built) restore();
      });

      document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === "hidden") pSave(true);
      });

      function tryResume() {
        if (wantResume && audio.paused && song) resume();
      }
      ["pointerdown", "touchstart", "click", "keydown"].forEach(function(name) {
        document.addEventListener(name, tryResume, true);
      });

      /* ===================== UPDATED PLAYER DESIGN ===================== */
      var CSS = [
        ':host{font-family:' + FONT + ';}',
        '*{box-sizing:border-box;font-family:inherit;}',
        'button{font:inherit;-webkit-tap-highlight-color:transparent;}',
        'button:active::after{display:none;}',

        /* MINI PLAYER */
        '#mini{display:none;position:fixed;left:0;right:0;bottom:var(--mb,0px);z-index:1500;background:#181818;color:#fff;border-top:1px solid rgba(255,255,255,.1);cursor:pointer;-webkit-tap-highlight-color:transparent;}',
        '#mini.show{display:block;}',
        '#mTrack{height:2px;background:rgba(255,255,255,.18);}',
        '#mFill{height:100%;width:0;background:#fff;}',
        '#mRow{display:flex;align-items:center;gap:6px;padding:8px 8px 8px 10px;}',
        '#mCover{width:40px;height:40px;aspect-ratio:1/1;object-fit:cover;border-radius:6px;background:#2a2a2a;flex-shrink:0;}',
        '#mInfo{flex:1;min-width:0;margin-left:2px;}',
        '#mTitle{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '#mArtist{font-size:12px;margin-top:2px;color:rgba(255,255,255,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '.mBtn{width:34px;height:34px;padding:0;border:0;border-radius:50%;background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}',
        '#mPlay{background:#fff;color:#080808;}',
        '#mClose{color:rgba(255,255,255,.7);font-size:24px;line-height:1;}',

        /* FULL SCREEN PLAYER */
        '#card{position:fixed;inset:0;z-index:2000;width:100%;height:100vh;height:100dvh;padding:0px 20px 24px;display:flex;flex-direction:column;align-items:center;overflow-y:auto;overflow-x:hidden;color:white;background:radial-gradient(circle at 50% 18%,rgba(90,90,90,.45),transparent 45%),linear-gradient(180deg,#212121 0%,#111111 50%,#070707 100%);transform:translateY(100%);opacity:0;visibility:hidden;transition:transform .38s cubic-bezier(.22,1,.36,1),opacity .25s ease,visibility .38s;}',
        '#card.show{transform:translateY(0);opacity:1;visibility:visible;}',
        '#card *{box-sizing:border-box;}',
        '.wrap{width:100%;max-width:400px;margin:0 auto;display:flex;flex-direction:column;align-items:stretch;}',

        /* TOP BAR */
        '.top{width:100%;min-height:44px;display:grid;grid-template-columns:44px 1fr 44px;align-items:center;}',
        '.top span{text-align:center;font-size:11px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.55);}',
        '.top button{width:40px;height:40px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.09);color:white;font-size:24px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;}',

        /* ALBUM COVER */
        '.cover{width:min(78vw,320px,42dvh);aspect-ratio:1/1;margin:22px auto 26px;flex-shrink:0;}',
        '#cCover{width:100%;height:100%;aspect-ratio:1/1;display:block;object-fit:cover;object-position:center;border-radius:20px;background:#181818;box-shadow:0 25px 60px rgba(0,0,0,.65);}',

        /* SONG INFORMATION */
        '.info{width:100%;margin-bottom:22px;text-align:center;}',
        '#cTitle{margin:0;font-size:24px;font-weight:700;line-height:1.25;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '#cArtist{margin:6px 0 0;font-size:15px;color:rgba(255,255,255,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',

        /* PROGRESS + TIME */
        '#prog{display:block;width:100%;height:5px;margin:0;padding:0;appearance:none;-webkit-appearance:none;border:0;outline:none;border-radius:10px;background:#555;cursor:pointer;}',
        '#prog::-webkit-slider-thumb,#vol::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:14px;height:14px;border:0;border-radius:50%;background:white;cursor:pointer;}',
        '#prog::-moz-range-thumb,#vol::-moz-range-thumb{width:14px;height:14px;border:0;border-radius:50%;background:white;cursor:pointer;}',
        '.time{width:100%;margin-top:8px;display:flex;justify-content:space-between;color:rgba(255,255,255,.45);font-size:12px;}',

        /* CONTROLS */
        '.controls{width:100%;margin:22px 0 18px;display:flex;align-items:center;justify-content:center;gap:36px;}',
        '.ctl{width:48px;height:48px;padding:0;border:0;border-radius:50%;background:transparent;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;}',
        '.ctl:active,.big:active{transform:scale(.88);}',
        '.big{width:68px;height:68px;padding:0;border:0;border-radius:50%;background:white;color:#080808;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.45);}',

        /* VOLUME */
        '.vol{width:100%;margin-top:20px;padding-top:8px;display:flex;align-items:center;justify-content:center;gap:12px;}',
        '.vol span{width:22px;flex-shrink:0;text-align:center;color:rgba(255,255,255,.65);font-size:18px;}',
        '#vol{flex:1;width:100%;max-width:240px;height:5px;margin:0;padding:0;appearance:none;-webkit-appearance:none;border:0;outline:none;border-radius:10px;background:#555;cursor:pointer;}',

        /* PHONE OPTIMIZATION */
        '@media(max-width:600px){',
        '#card{padding:14px 18px 22px;}',
        '.cover{width:76vw;height:76vw;margin:15px auto 23px;}',
        '#cTitle{font-size:23px;}',
        '.controls{gap:27px;margin:22px 0;}',
        '.big{width:63px;height:63px;}',
        '.ctl{width:45px;height:45px;}',
        '#prog{height:5px;}',
        '.top{width:100%;}',
        '}',

        /* SMALL HEIGHT PHONES */
        '@media(max-height:700px){',
        '.cover{width:55vw;height:55vw;margin:8px auto 15px;}',
        '#cTitle{font-size:21px;}',
        '.info{margin-bottom:12px;}',
        '.controls{margin:14px 0;}',
        '}',

        /* VERY SMALL PHONES */
        '@media(max-height:600px){',
        '.cover{width:48vw;height:48vw;}',
        '.top{min-height:38px;}',
        '.controls{margin:10px 0;}',
        '}'
      ].join("\n");

      var HTML = [
        '<div id="mini">',
        '  <div id="mTrack"><div id="mFill"></div></div>',
        '  <div id="mRow">',
        '    <img id="mCover" alt="">',
        '    <div id="mInfo"><div id="mTitle"></div><div id="mArtist"></div></div>',
        '    <button class="mBtn" id="mPrev" aria-label="Previous"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 6v12L9 12z"/></svg></button>',
        '    <button class="mBtn" id="mPlay" aria-label="Play or pause"><svg id="mIcon" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">' + PLAY + '</svg></button>',
        '    <button class="mBtn" id="mNext" aria-label="Next"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 6v12l11-6z"/></svg></button>',
        '    <button class="mBtn" id="mClose" aria-label="Close and stop">×</button>',
        '  </div>',
        '</div>',
        '<div id="card"><div class="wrap">',
        '  <div class="top">',
        '    <button id="cClose" aria-label="Close player"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg></button>',
        '    <span>NOW PLAYING</span>',
        '    <button id="cClose2" aria-label="Close player">×</button>',
        '  </div>',
        '  <div class="cover"><img id="cCover" alt="Album cover"></div>',
        '  <div class="info"><h2 id="cTitle">Song Title</h2><p id="cArtist">Artist</p></div>',
        '  <div><input type="range" id="prog" min="0" max="100" value="0" step="0.1"><div class="time"><span id="cur">0:00</span><span id="total">0:00</span></div></div>',
        '  <div class="controls">',
        '    <button class="ctl" id="cPrev" aria-label="Previous song"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 6v12L9 12z"/></svg></button>',
        '    <button class="big" id="cPlay" aria-label="Play or pause"><svg id="cIcon" width="30" height="30" viewBox="0 0 24 24" fill="currentColor">' + PLAY + '</svg></button>',
        '    <button class="ctl" id="cNext" aria-label="Next song"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 6v12l11-6z"/></svg></button>',
        '  </div>',
        '  <div class="vol"><span>−</span><input type="range" id="vol" min="0" max="1" step="0.01" value="0.7"><span>+</span></div>',
        '</div></div>'
      ].join("\n");

      function childDoc() {
        try { return child ? child.document : null; } catch (e) { return null; }
      }

      function place() {
        if (!host) return;
        var d = shell ? childDoc() : document;
        var bar = d ? d.getElementById("down") : null;
        var h = bar ? bar.getBoundingClientRect().height : 0;
        host.style.setProperty("--mb", h + "px");
      }

      function setSpacer(show) {
        if (!shell) {
          if (spacer) spacer.style.display = show ? "block" : "none";
          return;
        }
        var d = childDoc();
        if (!d || !d.body) return;
        var sp = d.getElementById("vibe-spacer");
        if (!sp) {
          sp = d.createElement("div");
          sp.id = "vibe-spacer";
          sp.style.cssText = "height:64px;display:none;";
          d.body.appendChild(sp);
        }
        sp.style.display = show ? "block" : "none";
      }

      function barFill(el, pct) {
        el.style.background = "linear-gradient(to right,#fff " + pct + "%,#555 " + pct + "%)";
      }

      function prog() {
        if (!built || !song) return;
        var d = audio.duration;
        var pct = (isFinite(d) && d > 0) ? (audio.currentTime / d) * 100 : 0;
        $("mFill").style.width = pct + "%";
        $("prog").value = pct;
        barFill($("prog"), pct);
        $("cur").textContent = fmt(audio.currentTime);
        if (isFinite(d) && d > 0) $("total").textContent = fmt(d);
      }

      function ui() {
        if (!built) return;
        var showMini = !!song && (shell ? childMini : miniOn);
        $("mini").classList.toggle("show", showMini);
        setSpacer(showMini);
        place();

        if (!song) return;

        if (uiId !== String(song.id)) {
          uiId = String(song.id);
          var cover = song.cover_url || "";
          $("mCover").src = cover;
          $("cCover").src = cover;
          $("mTitle").textContent = song.title || "Unknown Song";
          $("mArtist").textContent = song.artist || "Unknown Artist";
          $("cTitle").textContent = song.title || "Unknown Song";
          $("cArtist").textContent = song.artist || "Unknown Artist";
          $("prog").value = 0;
          $("cur").textContent = "0:00";
          $("total").textContent = "0:00";
        }

        var icon = audio.paused ? PLAY : PAUSE;
        $("mIcon").innerHTML = icon;
        $("cIcon").innerHTML = icon;
        prog();
      }

      function open() {
        if (!built || !song) return;
        $("card").classList.add("show");
        document.body.style.overflow = "hidden";
      }

      function close() {
        if (!built) return;
        $("card").classList.remove("show");
        document.body.style.overflow = "";
      }

      function toggleCurrent() {
        if (!song) return;
        if (audio.paused) resume();
        else pause();
      }

      function build() {
        host = document.createElement("div");
        host.id = "vibe-player-host";
        document.body.appendChild(host);

        if (!shell) {
          spacer = document.createElement("div");
          spacer.id = "vibe-spacer";
          spacer.style.cssText = "height:64px;display:none;";
          document.body.appendChild(spacer);
        }

        root = host.attachShadow({ mode: "open" });
        root.innerHTML = "<style>" + CSS + "</style>" + HTML;
        built = true;

        $("mini").addEventListener("click", function(e) {
          if (e.target.closest("button")) return;
          open();
        });
        $("mPlay").addEventListener("click", toggleCurrent);
        $("mPrev").addEventListener("click", prev);
        $("mNext").addEventListener("click", function() { step(1); });
        $("mClose").addEventListener("click", stop);

        $("cClose").addEventListener("click", close);
        $("cClose2").addEventListener("click", close);
        $("cPlay").addEventListener("click", toggleCurrent);
        $("cPrev").addEventListener("click", prev);
        $("cNext").addEventListener("click", function() { step(1); });

        $("prog").addEventListener("input", function() {
          var d = audio.duration;
          if (isFinite(d) && d > 0) {
            audio.currentTime = (Number(this.value) / 100) * d;
            barFill(this, Number(this.value));
          }
        });

        $("vol").addEventListener("input", function() {
          audio.volume = Number(this.value);
          barFill(this, Number(this.value) * 100);
          pSave(true);
        });

        document.addEventListener("keydown", function(e) {
          if (e.key === "Escape") close();
        });

        window.addEventListener("resize", place);

        if (shell) {
          var frame = document.getElementById("view");
          if (frame) {
            frame.addEventListener("load", function() {
              var w = null;
              var attached = false;
              try { w = frame.contentWindow; attached = !!w.__vibeAttached; } catch (e) { w = null; }
              if (!attached) {
                child = w;
                childMini = false;
                ui();
              }
            });
          }
        }

        var saved = pRead();
        var vol = (saved && typeof saved.volume === "number") ? saved.volume : 0.7;
        audio.volume = vol;
        $("vol").value = vol;
        barFill($("vol"), vol * 100);
        barFill($("prog"), 0);

        restore();
        ui();
      }

      window.VibePlayer = {
        play: play,
        toggle: toggle,
        pause: pause,
        resume: resume,
        stop: stop,
        next: function() { step(1); },
        prev: prev,
        open: open,
        close: close,
        state: function() { return { song: song, playing: !audio.paused }; }
      };

      if (shell) {
        window.__vibeShell = {
          attach: function(win, mini) {
            child = win;
            childMini = !!mini;
            try { if (win.document.title) document.title = win.document.title; } catch (e) {}
            ui();
            emit();
          },
          tap: function() {
            if (wantResume && audio.paused && song) resume();
          }
        };
      }

      if (document.body) build();
      else document.addEventListener("DOMContentLoaded", build);
    }
})();