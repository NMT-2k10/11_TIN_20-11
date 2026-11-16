// Soft smoke and a quiet sky, driven by the existing scene clock.
(() => {
  const effects=new WeakMap();
  function smokeTexture() {
    const texture=document.createElement('canvas');texture.width=texture.height=192;
    const ctx=texture.getContext('2d');
    for(let i=0;i<9;i++){
      const x=55+Math.random()*82,y=55+Math.random()*82,r=30+Math.random()*43;
      const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
      gradient.addColorStop(0,'rgba(111,117,135,.13)');gradient.addColorStop(.4,'rgba(86,94,112,.065)');gradient.addColorStop(1,'rgba(65,73,92,0)');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,192,192);
    }
    return texture;
  }
  window.TributeAtmosphere={
    mount(scene){
      const canvas=document.createElement('canvas');canvas.className='fn-atmosphere';canvas.setAttribute('aria-hidden','true');scene.prepend(canvas);
      const ctx=canvas.getContext('2d'),texture=smokeTexture();
      const sky=document.createElement('canvas');
      const stars=Array.from({length:70},()=>({x:Math.random(),y:Math.random()*.78,r:.25+Math.random()*.65,alpha:.12+Math.random()*.28}));
      let width=0,height=0,dpr=1;const puffs=[];
      function resize(){
        width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.25);canvas.width=width*dpr;canvas.height=height*dpr;
        sky.width=width;sky.height=height;
        const paint=sky.getContext('2d');
        stars.forEach(star=>{paint.fillStyle=`rgba(222,231,244,${star.alpha})`;paint.beginPath();paint.arc(star.x*width,star.y*height,star.r,0,Math.PI*2);paint.fill();});
        const x=width*.83,y=height*.16,r=Math.min(width,height)*.017;
        paint.save();paint.globalAlpha=.3;paint.fillStyle='#e7dfc4';paint.beginPath();paint.arc(x,y,r,0,Math.PI*2);paint.fill();
        paint.globalCompositeOperation='destination-out';paint.globalAlpha=1;paint.beginPath();paint.arc(x+r*.42,y-r*.24,r*.96,0,Math.PI*2);paint.fill();paint.restore();
      }
      resize();addEventListener('resize',resize);
      effects.set(scene,{canvas,ctx,texture,sky,puffs,resize,dimensions:()=>({width,height,dpr})});
    },
    burst(scene,point){
      const effect=effects.get(scene);if(!effect)return;
      const {width,height}=effect.dimensions(),x=point[0]*width,y=(1-point[1])*height;
      for(let i=0;i<(width<768?2:4);i++)effect.puffs.push({x,y,age:0,life:4.5+Math.random()*1.5,radius:25+Math.random()*20,drift:10+Math.random()*14,rise:9+Math.random()*10,rotation:Math.random()*6.28});
      const limit=width<768?40:70;
      if(effect.puffs.length>limit)effect.puffs.splice(0,effect.puffs.length-limit);
    },
    frame(scene,dt){
      const effect=effects.get(scene);if(!effect)return;
      const {ctx,texture,sky,puffs}=effect,{width,height,dpr}=effect.dimensions();
      const delta=document.hidden?0:Math.max(0,Math.min(.05,dt));
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
      ctx.drawImage(sky,0,0,width,height);
      for(let i=puffs.length-1;i>=0;i--){
        const puff=puffs[i];puff.age+=delta;if(puff.age>puff.life){puffs.splice(i,1);continue;}
        const t=puff.age/puff.life,size=(puff.radius+puff.age*23)*2;
        ctx.save();ctx.translate(puff.x+puff.drift*puff.age,puff.y-puff.rise*puff.age);ctx.rotate(puff.rotation+puff.age*.035);
        ctx.globalAlpha=Math.min(1,puff.age*2)*(1-t)*.7;ctx.drawImage(texture,-size/2,-size/2,size,size);ctx.restore();
      }
    },
    dispose(scene){const effect=effects.get(scene);if(!effect)return;removeEventListener('resize',effect.resize);effect.canvas.remove();effects.delete(scene);}
  };
})();
