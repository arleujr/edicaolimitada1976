(() => {
  const stage = document.getElementById('stage');
  const scrollRoot = document.getElementById('benjamimScroll');
  const play = document.getElementById('playButton');
  const flash = document.getElementById('startFlash');
  const glitchRoot = document.getElementById('glitchSlices');
  const titleWrap = document.getElementById('titleWrap');
  const titleFrame = document.getElementById('titleFrame');
  const glitchBar = document.getElementById('glitchBar');
  const canvas = document.getElementById('fxCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const root = document.documentElement;
  const palms = [...document.querySelectorAll('.moving-palm')];
  const ufoLeft = document.getElementById('ufoLeft');
  const ufoRight = document.getElementById('ufoRight');
  const hummingbird = document.getElementById('hummingbird');
  const birdFlightPath = document.getElementById('birdFlightPath');
  const dolphinLeft = document.getElementById('dolphinLeft');
  const dolphinRight = document.getElementById('dolphinRight');
  const globeLeft = document.getElementById('globeLeft');
  const globeRight = document.getElementById('globeRight');
  const statueMain = document.getElementById('statueMain');
  const statueEcho1 = document.getElementById('statueEcho1');
  const statueEcho2 = document.getElementById('statueEcho2');
  const statueEcho3 = document.getElementById('statueEcho3');
  const statueEcho4 = document.getElementById('statueEcho4');
  const statueEcho5 = document.getElementById('statueEcho5');
  const popupPaint = document.getElementById('popupPaint');
  const popupExe = document.getElementById('popupExe');
  const popupMessage = document.getElementById('popupMessage');
  const popupMedia = document.getElementById('popupMedia');
  const paintPink = document.getElementById('paintPink');
  const paintBlue = document.getElementById('paintBlue');
  const paintYellow = document.getElementById('paintYellow');
  const paintCursor = document.getElementById('paintCursor');
  const flamingoMain = document.getElementById('flamingoMain');
  const flamingoEcho1 = document.getElementById('flamingoEcho1');
  const flamingoEcho2 = document.getElementById('flamingoEcho2');
  const flamingoEcho3 = document.getElementById('flamingoEcho3');
  const PALM_CYCLE = 3.65; // segundos: rápido como a referência
  let frozenPalmTime = 0;
  let birdPathLength = 0;
  let introStartTime = null;

  let W=0,H=0,dpr=1,started=false,introFrozen=false,frozenAmbientP=0,lastGlitch=0,glitchUntil=0;
  let lastHardGlitch=0,hardGlitchUntil=0,nextHardGlitchAt=0;
  let particles=[];

  // 9 horizontal VHS displacement fragments from the same background.
  for(let i=0;i<9;i++){
    const s=document.createElement('span');
    s.className='glitch-slice';
    const t=(7+i*10.4)%91;
    const h=1.2+(i%4)*.72;
    const dx=(i%2?1:-1)*(4+(i%3)*7);
    s.style.setProperty('--t', t+'%');
    s.style.setProperty('--h', h+'%');
    s.style.setProperty('--dx', dx+'px');
    glitchRoot.appendChild(s);
  }

  const clamp01=v=>Math.max(0,Math.min(1,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);
  const easeOutCubic=t=>1-Math.pow(1-t,3);
  const easeInQuad=t=>t*t;

  // V10: as palmeiras agora crescem a partir do MEIO do recorte,
  // expandindo para todas as direções enquanto saem do centro/horizonte.
  // Também misturamos melhor a sensação de profundidade, em vez de parecer
  // que só estão esticando para cima.
  function updatePalms(now){
    if(!palms.length) return;
    const baseTime = introFrozen ? frozenPalmTime : now * .001;
    const vw=W/100, vh=H/100;

    palms.forEach((el)=>{
      const side=el.dataset.side==='left'?-1:1;
      const phase=parseFloat(el.dataset.phase||'0');
      const lane=+(el.dataset.lane||0);
      const t=(baseTime/PALM_CYCLE + phase)%1;

      const visibleIn=clamp01(t/.04);
      const visibleOut=1-clamp01((t-.975)/.025);
      const opacity=Math.min(1, visibleIn*1.25) * visibleOut;

      const depth=smooth(t);
      const rush=Math.pow(depth, 1.02);
      const mega=Math.pow(depth, 2.05);
      const laneBias=(lane-1.5)*0.75;

      // Cresce do centro do sprite para todas as direções.
      const scale = 0.075 + rush*1.5 + mega*12.2;

      // Sai mais do centro/horizonte e abre com força para as laterais.
      const x = side * vw * (0.2 + laneBias*0.45 + 5.2*Math.pow(depth,0.9) + 63.5*mega);

      // Menos "subida"; a sensação vem mais do aumento geral e da abertura lateral.
      const y = vh * (-1.2 + 1.8*Math.pow(depth,0.85) + 12.5*Math.pow(depth,1.75));

      const rot = side*(0.08 + 0.55*Math.pow(depth,0.8) + 1.35*mega) + (lane%2?0.22:-0.14);

      const brightness=lerp(.72,1.12,rush);
      const saturation=lerp(.84,1.18,rush);
      const blur=Math.max(0, 0.45 - rush*0.78);

      el.style.opacity=opacity.toFixed(3);
      el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
      el.style.filter=`saturate(${saturation.toFixed(2)}) brightness(${brightness.toFixed(2)}) contrast(1.04) blur(${blur.toFixed(2)}px) drop-shadow(0 0 ${lerp(2,14,rush).toFixed(1)}px rgba(${side<0?'255,43,220':'67,235,255'},${lerp(.10,.30,rush).toFixed(2)}))`;
      el.style.zIndex=String(Math.floor(rush*130 + mega*130));
    });
  }

  function mix(a,b,t){ return a+(b-a)*t; }

  function flamingoMotion(p){
    // Movimento contínuo em duas curvas suaves: avança enquanto sobe/desce em ^^.
    const lift = Math.pow(Math.sin(Math.PI * 2 * p), 2); // picos em .25 e .75
    const x = -6 + 246 * p;
    const y = -52 * lift;
    return { x, y, lift };
  }

  function flamingoPeakStrength(p){
    const d1 = Math.abs(p - 0.25);
    const d2 = Math.abs(p - 0.75);
    const d = Math.min(d1, d2);
    return Math.max(0, 1 - d / 0.105);
  }

  function dolphinDive(p, side){
    // Mais baixo e um pouco mais rápido, para não cruzar os discos voadores
    // e permanecer mais atrás das palmeiras.
    const startX = side < 0 ? -0.22*W : W*0.82;
    const endX   = side < 0 ? W*0.39 : W*0.49;
    const x = lerp(startX, endX, p);
    const y = lerp(0.18*H, 0.49*H, p) - Math.sin(Math.PI*p)*H*0.12;
    const scale = 0.86 + Math.sin(Math.PI*p)*0.10;
    const rot = side < 0 ? lerp(8, 52, p) : lerp(-8, -52, p);
    const fadeOut = 1 - clamp01((p - 0.84) / 0.08);
    return { x, y, scale, rot, opacity: 0.99 * fadeOut };
  }

  function globeDropSpin(elapsed, side, delay=0){
    const local = Math.max(0, elapsed - delay);

    // A queda acontece UMA única vez.
    const drop = clamp01(local / 1.55);
    const settle = easeOutCubic(drop);

    const x = side < 0 ? W*0.145 : W*0.775;
    const y = lerp(-0.28*H, 0.075*H, settle);

    // Depois de chegar, continua o giro exagerado 2D no eixo Y.
    // Não volta para o teto e não reinicia a queda.
    const spinElapsed = Math.max(0, local - 0.72);
    const ry = spinElapsed * 145;
    const rx = 8 + Math.sin(spinElapsed * 1.7) * 2.2;
    const scale = 0.82 + settle*0.045;

    return { x, y, ry, rx, scale };
  }

  function statueFormation(p){
    // Uma única formação:
    // a estátua já nasce gigante no centro e, enquanto reduz ao tamanho final,
    // os clones também convergem simultaneamente para a mesma posição.
    const settle = easeOutCubic(p);
    const scale = lerp(3.15, 1.02, settle);
    const settleY = lerp(-14, 0, settle);
    return { scale, settle, settleY };
  }

  function popupEase(t){
    t=clamp01(t);
    // grow with a slight overshoot, then settle
    const back = 1.70158;
    const c3 = back + 1;
    return 1 + c3*Math.pow(t-1,3) + back*Math.pow(t-1,2);
  }

  function paintCursorPoint(name){
    // Coordenadas dos quadradinhos reais da paleta inferior,
    // extraídas da imagem anotada enviada pelo usuário.
    // 1 = rosa atual, 2 = amarelo, 3 = azul.
    const pts = {
      pink:   [68.74, 84.57],
      blue:   [51.90, 84.57],
      yellow: [79.97, 89.29]
    };
    return pts[name];
  }

  function movePaintCursor(a, b, p){
    const A=paintCursorPoint(a), B=paintCursorPoint(b);
    const e=smooth(clamp01(p));
    return [
      lerp(A[0],B[0],e),
      lerp(A[1],B[1],e)
    ];
  }

  function updatePaintPalette(elapsed){
    if(!paintCursor || !paintPink || !paintBlue || !paintYellow) return;

    // Começa depois que o popup Paint já entrou.
    const delay = 1.75;
    const t = Math.max(0, elapsed - delay);
    const cycle = 8.6;
    const u = t % cycle;

    let pos=paintCursorPoint('pink');
    let cursorOpacity=elapsed > delay ? 1 : 0;
    let blueOpacity=0;
    let yellowOpacity=0;

    // looping mais lento:
    // segura no rosa -> vai pro azul -> segura -> vai pro amarelo -> segura -> volta pro rosa -> segura
    if(u < 1.00){
      pos = paintCursorPoint('pink');
    }else if(u < 2.45){
      const p=(u-1.00)/1.45;
      pos = movePaintCursor('pink','blue',p);
      blueOpacity = clamp01((p-0.45)/0.35);
    }else if(u < 3.70){
      pos = paintCursorPoint('blue');
      blueOpacity = 1;
    }else if(u < 5.15){
      const p=(u-3.70)/1.45;
      pos = movePaintCursor('blue','yellow',p);
      blueOpacity = 1 - clamp01((p-0.40)/0.35);
      yellowOpacity = clamp01((p-0.48)/0.32);
    }else if(u < 6.40){
      pos = paintCursorPoint('yellow');
      yellowOpacity = 1;
    }else if(u < 7.85){
      const p=(u-6.40)/1.45;
      pos = movePaintCursor('yellow','pink',p);
      yellowOpacity = 1 - clamp01((p-0.42)/0.35);
    }else{
      pos = paintCursorPoint('pink');
    }

    paintPink.style.opacity='1';
    paintBlue.style.opacity=blueOpacity.toFixed(3);
    paintYellow.style.opacity=yellowOpacity.toFixed(3);
    paintCursor.style.opacity=cursorOpacity.toFixed(3);
    paintCursor.style.left=`${pos[0].toFixed(2)}%`;
    paintCursor.style.top=`${pos[1].toFixed(2)}%`;
    paintCursor.style.transform='translate(-34%,-18%)';
  }

  function updatePopups(now){
    const clock = introFrozen ? frozenPalmTime : now * .001;
    if(introStartTime === null) introStartTime = clock;
    const elapsed = Math.max(0, clock - introStartTime);

    updatePaintPalette(elapsed);

    const items = [
      {el:popupPaint,   delay:.48, dur:1.05, rot:-2.1, drift:.65, x:0, y:0},
      {el:popupExe,     delay:.92, dur:.82,  rot: 1.8, drift:.82, x:0, y:0},
      {el:popupMessage, delay:1.28, dur:.90, rot:-1.2, drift:.74, x:0, y:0},
      {el:popupMedia,   delay:1.62, dur:.92, rot: 1.35,drift:.78, x:0, y:0}
    ];

    items.forEach((it, idx)=>{
      if(!it.el) return;
      const local = (elapsed - it.delay) / it.dur;
      const p = clamp01(local);
      const e = popupEase(p);
      const baseScale = p <= 0 ? 0.05 : Math.max(.05, e);

      // After appearing once, they only "breathe" subtly; no re-growing loop.
      const settled = p >= 1;
      const floatY = settled ? Math.sin((clock + idx*.9)*it.drift)*2.2 : 0;
      const floatR = settled ? Math.sin((clock + idx*1.3)*it.drift*.72)*0.45 : 0;

      it.el.style.opacity = p <= 0 ? '0' : '0.985';
      it.el.style.transform =
        `translate3d(${it.x}px,${(it.y+floatY).toFixed(1)}px,0) ` +
        `scale(${baseScale.toFixed(3)}) rotate(${(it.rot*(1-p)+floatR).toFixed(2)}deg)`;
    });
  }

  function updateStatue(now){
    if(!statueMain) return;

    const clock = introFrozen ? frozenPalmTime : now * .001;
    if(introStartTime === null) introStartTime = clock;

    const elapsed = Math.max(0, clock - introStartTime);
    const p = clamp01(elapsed / 2.75);
    const s = statueFormation(p);

    statueMain.style.transform =
      `translate(-50%,-50%) translate3d(0,${s.settleY.toFixed(1)}px,0) scale(${s.scale.toFixed(3)})`;
    statueMain.style.opacity = '0.985';

    const echoes = [statueEcho1, statueEcho2, statueEcho3, statueEcho4, statueEcho5];
    const offsets = [
      [-260,-95,0.20],
      [248,-116,0.16],
      [-190,148,0.13],
      [188,136,0.11],
      [0,-205,0.17]
    ];

    echoes.forEach((el, idx)=>{
      if(!el) return;
      const [ox,oy,extraScale] = offsets[idx];

      // Cada clone começa deslocado e volta para a estátua AO MESMO TEMPO
      // em que a principal sai do tamanho gigante.
      const delayed = clamp01((p - idx*0.035) / (1 - idx*0.035));
      const arrive = easeOutCubic(delayed);
      const x = ox * (1 - arrive);
      const y = oy * (1 - arrive) + s.settleY;
      const esc = s.scale * lerp(1 + extraScale, 1.0, arrive);

      // Visíveis durante a formação e somem somente no final,
      // deixando a estátua principal consolidada.
      const fade = 1 - clamp01((p - 0.78) / 0.20);
      const intro = clamp01(p / 0.10);
      el.style.opacity = (0.82 * intro * fade).toFixed(3);
      el.style.transform =
        `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${esc.toFixed(3)})`;
    });
  }

  function updateFloaters(now){
    const t = introFrozen ? frozenPalmTime : now * .001;

    if(ufoLeft){
      const bob=Math.sin(t*1.9)*10 + Math.sin(t*0.63)*6;
      const drift=Math.sin(t*0.72)*16 + Math.cos(t*0.31)*8;
      const rot=Math.sin(t*0.85)*2.2;
      const glow=.96 + Math.sin(t*1.4)*.04;
      ufoLeft.style.transform=`translate3d(${drift.toFixed(1)}px,${bob.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${glow.toFixed(3)})`;
    }
    if(ufoRight){
      const bob=Math.sin(t*1.7+1.2)*11 + Math.cos(t*0.54)*5;
      const drift=-Math.sin(t*0.78+0.4)*18 + Math.cos(t*0.25)*6;
      const rot=-Math.sin(t*0.92+0.6)*2.4;
      const glow=.96 + Math.cos(t*1.33)*.045;
      ufoRight.style.transform=`translate3d(${drift.toFixed(1)}px,${bob.toFixed(1)}px,0) scaleX(-1) rotate(${rot.toFixed(2)}deg) scale(${glow.toFixed(3)})`;
    }

    if(dolphinLeft && dolphinRight){
      const p=((t*0.132)%1+1)%1;
      const left = dolphinDive(p, -1);
      const right = dolphinDive(p, 1);
      dolphinLeft.style.opacity = left.opacity.toFixed(3);
      dolphinRight.style.opacity = right.opacity.toFixed(3);
      dolphinLeft.style.transform = `translate3d(${left.x.toFixed(1)}px,${left.y.toFixed(1)}px,0) scale(${left.scale.toFixed(3)}) rotate(${left.rot.toFixed(2)}deg)`;
      dolphinRight.style.transform = `translate3d(${right.x.toFixed(1)}px,${right.y.toFixed(1)}px,0) scale(${right.scale.toFixed(3)}) rotate(${right.rot.toFixed(2)}deg)`;
    }

    if(globeLeft && globeRight){
      if(introStartTime === null) introStartTime = t;
      const elapsed = Math.max(0, t - introStartTime);

      const left = globeDropSpin(elapsed, -1, 0.10);
      const right = globeDropSpin(elapsed, 1, 0.34);

      globeLeft.style.transform =
        `translate3d(${left.x.toFixed(1)}px,${left.y.toFixed(1)}px,0) perspective(900px) rotateX(${left.rx.toFixed(2)}deg) rotateY(${left.ry.toFixed(2)}deg) scale(${left.scale.toFixed(3)})`;
      globeRight.style.transform =
        `translate3d(${right.x.toFixed(1)}px,${right.y.toFixed(1)}px,0) perspective(900px) rotateX(${right.rx.toFixed(2)}deg) rotateY(${right.ry.toFixed(2)}deg) scale(${right.scale.toFixed(3)})`;
    }

    if(flamingoMain){
      const p=((t*0.138)%1+1)%1;
      const motion = flamingoMotion(p);
      const peak = flamingoPeakStrength(p);
      const baseX = 4;
      const baseY = 42;

      // Mantém a leitura 'andando dentro do site': maior e mais presente,
      // mas ainda com a base das pernas cortada pelo limite inferior.
      const scale = 0.92 + motion.lift*0.13 + Math.sin(t*1.1)*0.008;
      const lean = -1.1 + Math.sin(t*2.1)*0.65;

      flamingoMain.style.transform =
        `translate3d(${(baseX+motion.x).toFixed(1)}px,${(baseY+motion.y).toFixed(1)}px,0) ` +
        `scale(${scale.toFixed(3)}) rotate(${lean.toFixed(2)}deg)`;
      flamingoMain.style.opacity='0.99';

      // Multiplicação sólida no ápice, mais próxima da lógica do site de referência.
      const echoes=[flamingoEcho1, flamingoEcho2, flamingoEcho3];
      const echoOffsets=[[-22,6],[-46,11],[-71,16]];
      const thresholds=[0.30,0.50,0.72];

      echoes.forEach((el, idx)=>{
        if(!el) return;
        const [ox,oy]=echoOffsets[idx];
        const visible = peak >= thresholds[idx];
        const esc = scale * (0.995 - idx*0.02);
        el.style.opacity = visible ? '0.99' : '0';
        el.style.transform =
          `translate3d(${(baseX+motion.x+ox).toFixed(1)}px,${(baseY+motion.y+oy).toFixed(1)}px,0) ` +
          `scale(${esc.toFixed(3)}) rotate(${lean.toFixed(2)}deg)`;
      });
    }

    if(hummingbird && birdFlightPath && birdPathLength){
      // invertido: agora o voo percorre da esquerda para a direita,
      // e a imagem é espelhada para o bico sempre apontar para a frente.
      const loop=((t*0.052)%1+1)%1; // ~19s por volta
      const len=(1-loop)*birdPathLength;
      const backLen=(len-0.35+birdPathLength)%birdPathLength;
      const pt=birdFlightPath.getPointAtLength(len);
      const pt2=birdFlightPath.getPointAtLength(backLen);
      const angle=Math.atan2(pt.y-pt2.y, pt.x-pt2.x)*180/Math.PI;
      const x=(pt.x/100)*W;
      const y=(pt.y/60)*H;
      const flap=Math.sin(t*15)*6;
      const bob=Math.sin(t*10)*2.8;
      const squash=1 + Math.sin(t*15)*0.025;
      hummingbird.style.transform=`translate3d(${x.toFixed(1)}px,${(y+bob).toFixed(1)}px,0) translate(-50%,-50%) rotate(${angle.toFixed(2)}deg) scaleX(-1) skewY(${(flap*0.12).toFixed(2)}deg) scale(${squash.toFixed(3)})`;
    }
  }

  function resize(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=innerWidth; H=innerHeight;
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(birdFlightPath){
      try{ birdPathLength = birdFlightPath.getTotalLength(); }catch(e){ birdPathLength = 0; }
    }
    makeParticles();
  }

  function makeParticles(){
    const count=Math.max(28,Math.min(78,Math.floor(W/24)));
    particles=Array.from({length:count},(_,i)=>({
      x:Math.random()*W,y:Math.random()*H,
      r:Math.random()*1.25+.22,
      a:Math.random()*.75+.12,
      speed:Math.random()*.08+.015,
      drift:(Math.random()-.5)*.055,
      phase:Math.random()*Math.PI*2,
      cyan:i%3===0
    }));
  }

  function progress(){
    const max=Math.max(1,scrollRoot.offsetHeight-innerHeight);
    return Math.max(0,Math.min(1,scrollY/max));
  }

  function setProgress(p){
    const ambientP=introFrozen?frozenAmbientP:p;

    // Tudo que pertence à tela inicial usa ambientP. Ao dar PLAY/scroll,
    // esse valor congela e nenhum movimento ambiente continua escondido.
    root.style.setProperty('--p',ambientP.toFixed(4));
    root.style.setProperty('--rgb',(ambientP<.08?0.7:1.0+Math.sin(ambientP*18)*.7+ambientP*2.1)+'px');
    root.style.setProperty('--glow',(0.78+ambientP*.18).toFixed(3));
    root.style.setProperty('--scene-brightness',(1+ambientP*.035).toFixed(3));

    // O título continua podendo recuar depois do START, pois isso já é a transição
    // para a próxima etapa e não faz parte do loop ambiente da tela inicial.
    const transitionP = started ? p : 0;
    const titleFade = 1 - Math.max(0,Math.min(1,(transitionP-.18)/.29));
    root.style.setProperty('--title-opacity',titleFade.toFixed(3));
    root.style.setProperty('--title-scale',(1-transitionP*.045).toFixed(4));
    root.style.setProperty('--title-y',(-transitionP*18).toFixed(1)+'px');

  }

  function triggerStart(fromClick=true){
    if(started && fromClick){ window.location.assign("manual.html"); return; }
    started=true;
    frozenAmbientP=progress();
    introFrozen=true;
    frozenPalmTime=performance.now()*.001;
    stage.classList.remove('glitching','hard-glitch');
    titleWrap.classList.remove('play-hover');
    glitchUntil=0;
    hardGlitchUntil=0;
    stage.classList.add('started');
    flash.classList.remove('fire');void flash.offsetWidth;flash.classList.add('fire');
    if(fromClick){
      window.location.assign("manual.html");
    }
  }

  // Hover no PLAY dispara o MESMO efeito na palavra BEIJAMIM.
  const enableTitleHoverGlitch=()=>titleWrap.classList.add('play-hover');
  const disableTitleHoverGlitch=()=>titleWrap.classList.remove('play-hover');
  play.addEventListener('pointerenter',enableTitleHoverGlitch);
  play.addEventListener('pointerleave',disableTitleHoverGlitch);
  play.addEventListener('focus',enableTitleHoverGlitch);
  play.addEventListener('blur',disableTitleHoverGlitch);

  play.addEventListener('click',()=>triggerStart(true));

  window.addEventListener('pointermove',(e)=>{
    if(introFrozen) return;
    const mx=(e.clientX/W-.5)*2;
    const my=(e.clientY/H-.5)*2;
    root.style.setProperty('--mx',mx.toFixed(3));
    root.style.setProperty('--my',my.toFixed(3));
  },{passive:true});

  function randomGlitch(now,p){
    const interval=started? 1100-p*380 : 2600;
    if(now-lastGlitch>interval && Math.random()<.055+p*.045){
      lastGlitch=now;
      glitchUntil=now+(120+Math.random()*160);
      // Mantém o glitch geral da tela separado, mas o efeito da palavra
      // usa exatamente a mesma classe do hover para ficar idêntico.
      titleWrap.classList.add('play-hover');
    }
    if(glitchUntil && now>glitchUntil){
      glitchUntil=0;
      titleWrap.classList.remove('play-hover');
    }
  }

  function hardScreenGlitch(now,p){
    if(!nextHardGlitchAt){
      nextHardGlitchAt=now+(started?900+Math.random()*1500:1800+Math.random()*2600);
    }
    if(now>=nextHardGlitchAt && !hardGlitchUntil){
      lastHardGlitch=now;
      hardGlitchUntil=now+(65+Math.random()*85);
      nextHardGlitchAt=now+(started?850+Math.random()*1700:1700+Math.random()*2800);
      stage.classList.add('hard-glitch');
      glitchBar.style.setProperty('--bar-y',(8+Math.random()*82).toFixed(1)+'%');
      glitchBar.style.setProperty('--bar-h',(2+Math.random()*9).toFixed(1)+'px');
      glitchBar.style.setProperty('--bar-x',((Math.random()-.5)*34).toFixed(1)+'px');
      root.style.setProperty('--rgb',(5+Math.random()*10).toFixed(1)+'px');
    }
    if(hardGlitchUntil && now>hardGlitchUntil){
      hardGlitchUntil=0;
      stage.classList.remove('hard-glitch');
    }
  }

  function draw(now,p){
    ctx.clearRect(0,0,W,H);
    const t=now*.001;
    const speed=1+p*2.2;
    for(const q of particles){
      q.y-=q.speed*speed*1.6;
      q.x+=q.drift*speed;
      if(q.y<-8){q.y=H+8;q.x=Math.random()*W}
      if(q.x<-8)q.x=W+8;if(q.x>W+8)q.x=-8;
      const pulse=.38+.62*(.5+.5*Math.sin(t*(.8+q.speed*7)+q.phase));
      const alpha=q.a*pulse*(.56+p*.34);
      ctx.beginPath();ctx.arc(q.x,q.y,q.r*(1+p*.25),0,Math.PI*2);
      ctx.fillStyle=q.cyan?`rgba(91,246,255,${alpha})`:`rgba(255,78,224,${alpha})`;
      ctx.shadowBlur=7+q.r*5;ctx.shadowColor=q.cyan?'rgba(72,240,255,.7)':'rgba(255,57,219,.7)';
      ctx.fill();
      if(q.r>1.15 && pulse>.82){
        ctx.globalAlpha=alpha*.45;ctx.fillRect(q.x-5,q.y,.1,10);ctx.fillRect(q.x,q.y-5,10,.1);ctx.globalAlpha=1;
      }
    }
    ctx.shadowBlur=0;
  }

  function loop(now){
    if(introStartTime === null) introStartTime = now * .001;
    const p=progress();
    setProgress(p);
    updateStatue(now);
    updatePopups(now);
    updatePalms(now);
    updateFloaters(now);
    if(!introFrozen){
      randomGlitch(now,p);
      hardScreenGlitch(now,p);
      draw(now,p);
    }
    requestAnimationFrame(loop);
  }

  addEventListener('resize',resize,{passive:true});
  resize();requestAnimationFrame(loop);
})();
