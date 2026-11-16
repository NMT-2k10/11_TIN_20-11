// Sharp, accessible lettering above the fireworks; the sky remains interactive.
(() => {
  function text(tag, className, value) {
    const node=document.createElement(tag);node.className=className;node.textContent=value;return node;
  }
  window.FinaleTribute={
    async loadFont(){try{await document.fonts.load('700 150px FireworkSerif','Tri ân thầy cô Người gieo ước mơ 20/11');}catch{}},
    // A bold raster mask produces dense, complete strokes, including Vietnamese marks.
    textPoints(label,count) {
      const value=String(label||'').trim();
      const greeting=/ch\u00fac.*m\u1eebng/i.test(value);
      let lines=greeting?(innerWidth<600?['Ch\u00fac m\u1eebng','ng\u00e0y nh\u00e0 gi\u00e1o','Vi\u1ec7t Nam']:['Ch\u00fac m\u1eebng ng\u00e0y','nh\u00e0 gi\u00e1o Vi\u1ec7t Nam']):/tri.*th\u1ea7y/i.test(value)?['Tri \u00e2n','th\u1ea7y c\u00f4']:/ng\u01b0\u1eddi.*gieo/i.test(value)?['Ng\u01b0\u1eddi gieo','\u01b0\u1edbc m\u01a1']:[value.replace(/20\.11/,'20/11')];
      if(lines.length===1&&lines[0].length>16){const words=lines[0].split(/\s+/),middle=Math.ceil(words.length/2);lines=[words.slice(0,middle).join(' '),words.slice(middle).join(' ')];}
      const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=440;
      const ctx=canvas.getContext('2d');if(!ctx)return null;
      let size=Math.min(lines.length>1?158:220,Math.floor(376/(1+(lines.length-1)*1.3)));
      do{ctx.font='700 '+size+'px FireworkSerif, Georgia, serif';if(lines.every(line=>ctx.measureText(line).width<920))break;size-=4;}while(size>40);
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.strokeStyle='#fff';ctx.lineWidth=1;
      const spacing=size*1.3;
      lines.forEach((line,index)=>{const y=220+(index-(lines.length-1)/2)*spacing;ctx.strokeText(line,512,y);ctx.fillText(line,512,y);});
      const pixels=ctx.getImageData(0,0,1024,440).data,points=[];
      for(let y=6;y<434;y+=2)for(let x=20;x<1004;x+=2)if(pixels[(y*1024+x)*4+3]>130)points.push([x,y]);
      if(!points.length)return null;
      const result=new Float32Array(count*3);
      for(let i=0;i<count;i++){const point=points[Math.floor((i+.5)/count*points.length)];result[i*3]=(point[0]-512)/1024*20;result[i*3+1]=(220-point[1])/1024*20;result[i*3+2]=0;}
      return result;
    },
    vertexShader: `
      uniform float uTime,uSizeScale,uT0,uFlight,uHold;
      uniform vec3 uOrigin,uLaunch,uColA,uColB;
      attribute vec3 aTarget;attribute vec4 aRnd;
      varying vec3 vColor;varying float vAlpha;
      void main(){
        float t=uTime-uT0;vec3 p=uLaunch;float alpha=0.0;float size=0.0;
        if(t>0.0&&t<uFlight){
          float k=clamp(t/uFlight,0.0,1.0);p=mix(uLaunch,uOrigin,1.0-pow(1.0-k,2.0));
          alpha=aRnd.x<0.035?0.95:0.0;size=0.14;
        }else if(t>=uFlight){
          float bt=t-uFlight;
          vec3 dir=normalize(vec3(aRnd.x-.5,aRnd.y-.5,aRnd.z-.5)+.0001);
          vec3 burst=uOrigin+dir*(3.0+aRnd.w*3.0);
          float gather=smoothstep(.22,1.05,bt);
          p=mix(mix(uOrigin,burst,smoothstep(0.0,.24,bt)),uOrigin+aTarget,gather);
          p+=vec3(sin(uTime*1.3+aRnd.z*9.0),cos(uTime*1.2+aRnd.w*9.0),0.0)*.007*gather;
          float fall=max(0.0,bt-1.05-uHold);
          p.y-=fall*fall*(.8+aRnd.y);p.x+=fall*(aRnd.x-.5)*.45;
          alpha=(.9+.05*sin(uTime*2.0+aRnd.x*20.0))*(1.0-smoothstep(0.0,.8,fall));
          size=mix(.145,.105,smoothstep(0.0,1.0,bt));
        }
        vColor=mix(vec3(.95,.78,.47),vec3(1.0,.94,.77),aRnd.z);vAlpha=alpha;
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        gl_PointSize=alpha>.002?clamp(size*uSizeScale/-mv.z,2.6,4.2):0.0;
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;varying float vAlpha;
      void main(){
        float d=length(gl_PointCoord-.5)*2.0;
        if(d>1.0)discard;
        float core=exp(-d*d*4.0);
        float alpha=(core+exp(-d*d*3.0)*.12)*vAlpha;
        if(alpha<.015)discard;
        gl_FragColor=vec4(vColor,min(.95,alpha));
      }`,
    mount(scene) {
      if(scene.querySelector('.tribute-hero'))return;
      const config=parent.GIFT_CONFIG||{};
      const hero=document.createElement('section');hero.className='tribute-hero';
      hero.setAttribute('aria-label','Lời tri ân ngày Nhà giáo Việt Nam');
      hero.append(text('p','tribute-eyebrow','CHÚC MỪNG NGÀY NHÀ GIÁO VIỆT NAM'));
      const date=text('div','tribute-date','20');
      date.append(text('span','tribute-date-flower','✿'),document.createTextNode('11'));
      date.setAttribute('aria-label','Ngày 20 tháng 11');hero.append(date);
      hero.append(text('h1','tribute-title','Tri ân thầy cô'));
      hero.append(text('div','tribute-rule','✧'));
      const caption=text('p','tribute-caption','Gửi người gieo những ước mơ');
      caption.setAttribute('aria-live','polite');hero.append(caption);
      hero.append(text('p','tribute-quote',config.finalMessage||'Dẫu đi muôn phương, vẫn nhớ người dẫn lối.'));
      hero.append(text('p','tribute-signature',(config.sender||'Những học trò của thầy cô')+' ♡'));
      scene.append(hero,text('div','tribute-sky-frame',''));
    },
    showText(scene,label) {
      const caption=scene?.querySelector('.tribute-caption');if(!caption)return;
      const value=String(label||'').trim();
      caption.textContent=/20[./]11/.test(value)?'20 tháng 11 · Một ngày, ngàn lời biết ơn':/tri.*thầy/i.test(value)?'Cảm ơn thầy cô vì những mùa hoa tri thức':/người.*gieo/i.test(value)?'Người gieo ước mơ · Mãi trong tim học trò':value;
      if(caption.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)
        caption.animate([{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,easing:'ease-out'});
    }
  };
})();
