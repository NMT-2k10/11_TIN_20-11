// Themed shells share the same particle budget and scene clock.
// 0 peony, 1 ring, 2 heart, 3 willow, 4 chrysanthemum,
// 5 crossed rings, 6 palm, 7 spiral, 8 splitting crossette,
// 9 appreciation flower, 10 open book, 11 guiding star; 12-17 finale layers.
let tributeShellBag=[],tributeLastShell=-1;
window.TributePyro={
  nextType(){
    if(!tributeShellBag.length){
      tributeShellBag=Array.from({length:12},(_,i)=>i);
      for(let i=11;i>0;i--){const j=Math.floor(Math.random()*(i+1));[tributeShellBag[i],tributeShellBag[j]]=[tributeShellBag[j],tributeShellBag[i]];}
      if(tributeShellBag[11]===tributeLastShell)[tributeShellBag[0],tributeShellBag[11]]=[tributeShellBag[11],tributeShellBag[0]];
    }
    return tributeLastShell=tributeShellBag.pop();
  },
  vertexShader: `
    uniform float uTime,uSizeScale;
    uniform vec2 uSkySize;
    uniform vec4 uA[16],uB[16],uC[16],uD[16];
    attribute float aSlot,aTrail,aRay;
    attribute vec3 aDir;attribute vec4 aRnd;
    varying vec3 vColor;varying float vAlpha,vAngle,vTail;
    const float PI=3.14159265;
    vec3 heart(float a,float depth){
      float s=sin(a);
      return vec3(vec2(16.0*s*s*s,13.0*cos(a)-5.0*cos(2.0*a)-2.0*cos(3.0*a)-cos(4.0*a))/17.0,(depth-.5)*.12);
    }
    vec3 flowerPoint(float f){
      float angle=f*2.0*PI;
      if(mod(aRay,10.0)<2.0){
        float r=.18*sqrt(aRnd.z);
        return vec3(cos(angle)*r,sin(angle)*r,.1+.06*(1.0-r/.18));
      }
      float petal=floor(f*6.0),u=aRnd.z;
      angle=(petal+.5)*PI/3.0;
      float along=.18+.81*u;
      float across=(aRnd.y-.5)*.65*pow(sin(PI*u),.75);
      if(mod(aRay,10.0)<4.0)across=sign(aRnd.y-.5)*.325*pow(sin(PI*u),.75);
      vec2 xy=vec2(cos(angle),sin(angle))*along+vec2(-sin(angle),cos(angle))*across;
      float cup=.23*sin(PI*u)-across*across*.8+(aRnd.w-.5)*.035;
      return vec3(xy,cup);
    }
    vec3 bookPoint(float f){
      float group=mod(aRay,10.0);
      if(group<1.0)return vec3(0.0,mix(-.6,.42,f),.025);
      if(group>3.5){
        float side=mix(-1.0,1.0,step(.5,f));
        float x=.09+.82*aRnd.z;
        float low=-.6+.28*x,high=.42+.30*sin(x*PI*.5);
        float row=group<7.0?(floor(aRnd.y*5.0)+.5)/5.0:aRnd.y;
        float y=mix(low,high,row);
        return vec3(side*x,y,.2*sin(x*PI)+mix(.015,-.015,step(7.0,group)));
      }
      float edge=floor(f*8.0),k=fract(f*8.0);vec2 a,b;
      if(edge<.5){a=vec2(0.0,-.6);b=vec2(-.95,-.32);}
      else if(edge<1.5){a=vec2(-.95,-.32);b=vec2(-.95,.65);}
      else if(edge<2.5){a=vec2(-.95,.65);b=vec2(-.45,.75);}
      else if(edge<3.5){a=vec2(-.45,.75);b=vec2(0.0,.42);}
      else if(edge<4.5){a=vec2(0.0,.42);b=vec2(.45,.75);}
      else if(edge<5.5){a=vec2(.45,.75);b=vec2(.95,.65);}
      else if(edge<6.5){a=vec2(.95,.65);b=vec2(.95,-.32);}
      else{a=vec2(.95,-.32);b=vec2(0.0,-.6);}
      vec2 outline=mix(a,b,k);
      return vec3(outline,.2*sin(abs(outline.x)*PI));
    }
    vec3 starPoint(float f){
      float edge=floor(f*10.0),k=fract(f*10.0);
      float a=PI*.5+edge*PI*.2,b=a+PI*.2;
      float ra=mix(1.0,.44,mod(edge,2.0)),rb=mix(.44,1.0,mod(edge,2.0));
      return vec3(mix(vec2(cos(a),sin(a))*ra,vec2(cos(b),sin(b))*rb,k),0.0);
    }
    vec3 sculptPoint(vec3 p,float kind){
      if((kind>8.5&&kind<10.5)||(kind>12.5&&kind<13.5))return p;
      float fill=1.0-step(1.0,mod(aRay,4.0));
      // Preserve a crisp rim while adding interior grains and two depth surfaces.
      p.xy*=mix(1.0,.22+.73*sqrt(aRnd.z),fill);
      float surface=mix(-1.0,1.0,step(.5,aRnd.y));
      p.z=surface*(.055+.10*sqrt(max(0.0,1.0-dot(p.xy,p.xy))))+(aRnd.w-.5)*.035;
      if(kind>9.5&&kind<10.5)p.z+=.16*sin(abs(p.x)*PI);
      return p;
    }
    vec3 starPosition(vec3 origin,vec3 velocity,float drag,float gravity,float t){
      float travel=(1.0-exp(-drag*t))/drag;
      return origin+velocity*travel-vec3(0.0,gravity*(t-travel)/drag,0.0);
    }
    vec3 shellPosition(vec3 origin,vec3 velocity,float drag,float gravity,float t,float kind){
      if(kind>16.5){
        // A single parent shell carries sixteen small bouquets into the sky.
        float group=floor(aRnd.x*16.0),angle=group*2.39996323;
        float radius=sqrt((group+.5)/16.0);
        vec3 center=origin+vec3(cos(angle)*uSkySize.x*radius*.96,sin(angle)*uSkySize.y*radius*.86,sin(group*1.7)*.6);
        float split=.95;
        if(t<split)return mix(origin,center,1.0-pow(1.0-t/split,2.0));
        vec3 carry=(center-origin)*.08;
        return starPosition(center,velocity*1.9+carry,1.4,1.8,t-split);
      }
      if(kind>7.5&&kind<8.5){
        float angle=floor(aRay/4.0)*2.39996323;
        vec3 parent=vec3(cos(angle),sin(angle),.08*sin(angle*3.0))*length(velocity)*.8;
        float split=.78;
        if(t<=split)return starPosition(origin,parent,drag,gravity,t);
        vec3 atSplit=starPosition(origin,parent,drag,gravity,split);
        float branch=mod(aRay,4.0)*PI*.5+angle;
        vec3 outward=vec3(cos(branch),sin(branch),0.0)*length(velocity)*.32;
        vec3 carry=parent*exp(-drag*split)-vec3(0.0,gravity*(1.0-exp(-drag*split))/drag,0.0);
        return starPosition(atSplit,carry+outward,drag,gravity,t-split);
      }
      if((kind>8.5&&kind<11.5)||(kind>12.5&&kind<13.5)||(kind>14.5&&kind<15.5)){
        float form=1.0-pow(1.0-clamp(t/.9,0.0,1.0),3.0);
        float fall=max(0.0,t-2.55);
        vec3 relief=velocity*form;
        float yaw=.18+.12*sin(t*.65),pitch=.13;
        relief.xz=mat2(cos(yaw),sin(yaw),-sin(yaw),cos(yaw))*relief.xz;
        relief.yz=mat2(cos(pitch),sin(pitch),-sin(pitch),cos(pitch))*relief.yz;
        return origin+relief-vec3(0.0,fall*fall*.65,0.0);
      }
      vec3 p=starPosition(origin,velocity,drag,gravity,t);
      if(kind>6.5&&kind<7.5){
        float angle=1.8*(1.0-exp(-t*1.4));
        vec2 offset=p.xy-origin.xy+vec2(0.0,gravity*(t-(1.0-exp(-drag*t))/drag)/drag);
        p.xy=origin.xy+mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*offset-vec2(0.0,gravity*(t-(1.0-exp(-drag*t))/drag)/drag);
      }
      return p;
    }
    void main(){
      int slot=int(aSlot+.5);vec4 A=uA[slot],B=uB[slot],C=uC[slot],D=uD[slot];
      float age=uTime-A.w,flight=B.w;
      vec3 p=vec3(0.0),previous=vec3(0.0),color=C.rgb;
      float alpha=0.0,worldSize=.1;vTail=aTrail;
      if(age>0.0&&age<flight&&aRay<.5&&B.z>-.5){
        float rocketTail=C.w>11.5?.22:.11;
        float t=clamp((age-aTrail*rocketTail)/flight,0.0,1.0);
        float old=clamp((age-aTrail*rocketTail-.025)/flight,0.0,1.0);
        p=mix(B.xyz,A.xyz,2.0*t-t*t);previous=mix(B.xyz,A.xyz,2.0*old-old*old);
        color=mix(vec3(1.0,.94,.73),vec3(1.0,.42,.08),aTrail);
        alpha=pow(1.0-aTrail,1.25)*smoothstep(0.0,.04,age);worldSize=.17*(1.0-.45*aTrail);
        if(C.w>11.5)worldSize*=1.7;
      }else if(age>=flight){
        float willow=step(2.5,C.w)*step(C.w,3.5);
        float palm=step(5.5,C.w)*step(C.w,6.5);
        float longTail=max(willow,palm);
        float grand=step(11.5,C.w);
        if(C.w>13.5&&C.w<14.5)longTail=1.0;
        float delay=grand*mix(0.0,.65,clamp((C.w-12.0)/2.0,0.0,1.0));
        if(C.w>15.5)delay=.85+aRnd.w*.65;
        if(C.w>16.5)delay=.4;
        float t=age-flight-delay-aTrail*mix(.18,.34,longTail);
        if(t>0.0){
          vec3 direction=aDir;
          if(C.w>.5&&C.w<1.5){
            direction=normalize(vec3(aDir.xy,aDir.z*.04));float tilt=.25*sin(float(slot)*1.9);
            direction=vec3(direction.x,direction.y*cos(tilt),direction.y*sin(tilt));
          }else if(C.w>1.5&&C.w<2.5)direction=heart(aRnd.x*2.0*PI,aRnd.y);
          else if(C.w>3.5&&C.w<4.5){
            float angle=aRay*2.39996323,layer=mod(aRay,3.0);
            direction=vec3(cos(angle),sin(angle),aDir.z*.1)*(.48+layer*.26);
          }else if(C.w>4.5&&C.w<5.5){
            float angle=aRnd.x*2.0*PI,ring=mod(aRay,2.0);
            float tilt=mix(-.65,.65,ring);
            direction=vec3(cos(angle),sin(angle)*cos(tilt),sin(angle)*sin(tilt));
          }else if(C.w>5.5&&C.w<6.5){
            float arm=mod(aRay,7.0),angle=(arm-3.0)*.34;
            direction=vec3(sin(angle),cos(angle)*.85,.04*aDir.z);
            direction.xy+=aDir.xy*.035;
          }else if(C.w>6.5&&C.w<7.5){
            float angle=mod(aRay,5.0)*PI*.4;
            direction=vec3(cos(angle),sin(angle),aDir.z*.06)*(.25+.75*aRnd.z);
          }else if((C.w>8.5&&C.w<9.5)||(C.w>12.5&&C.w<13.5)){
            direction=flowerPoint(aRnd.x);
          }else if(C.w>9.5&&C.w<10.5){
            direction=bookPoint(aRnd.x);
          }else if((C.w>10.5&&C.w<11.5)||(C.w>14.5&&C.w<15.5)){
            direction=starPoint(aRnd.x);
          }else if(C.w>13.5&&C.w<14.5){
            direction=vec3(aDir.x,aDir.y,aDir.z*.6)*(.7+.35*aRnd.z);
          }
          float sculpted=0.0;
          if((C.w>8.5&&C.w<11.5)||(C.w>12.5&&C.w<13.5)||(C.w>14.5&&C.w<15.5)){
            direction=sculptPoint(direction,C.w);sculpted=1.0;
          }
          float canopy=0.0;
          if((C.w>11.5&&C.w<12.5)||(C.w>13.5&&C.w<14.5)||(C.w>15.5&&C.w<16.5)){
            canopy=1.0;direction.z*=.18;
            if(C.w>15.5)direction*=.45+.85*sqrt(aRnd.z);
          }
          float inner=1.0-step(.2,aRnd.w);
          float sphere=1.0-step(.5,C.w);
          float radius=D.w*(.88+.24*aRnd.z)*mix(1.0,.42,inner*sphere);
          if(C.w>7.5)radius=D.w;
          if(C.w>11.5&&C.w<12.5)radius*=.72+.42*aRnd.z;
          float drag=mix(1.5,.85,longTail),gravity=mix(2.3,3.15,longTail);
          vec3 velocity=direction*radius*mix(1.5,1.15,longTail);
          if(C.w>8.5)velocity=direction*radius;
          if(canopy>.5)velocity.xy*=uSkySize/max(.1,min(uSkySize.x,uSkySize.y));
          if(grand>.5){drag=1.05;gravity=1.35;}
          if(canopy>.5){drag+=aRnd.y*.2;gravity*=.75+.5*aRnd.w;}
          p=shellPosition(A.xyz,velocity,drag,gravity,t,C.w);
          previous=shellPosition(A.xyz,velocity,drag,gravity,max(0.0,t-.035),C.w);
          float life=mix(2.9,4.35,longTail)*(.88+.24*aRnd.w);
          if(C.w>8.5&&C.w<11.5)life=3.8;
          if(grand>.5)life=mix(4.4,5.8,longTail);
          if(C.w>15.5)life=6.2;
          if(C.w>16.5)life=6.8;
          float burn=1.0-smoothstep(life*.42,life,t);
          alpha=smoothstep(0.0,.035,t)*burn*pow(1.0-aTrail,1.35);
          if(C.w>7.5&&C.w<8.5)alpha*=mix(.38,1.0,smoothstep(.78,.92,t));
          color=mix(C.rgb,D.rgb,aRnd.z*.8);
          color=mix(color,vec3(1.0,.36,.055),smoothstep(life*.55,life,t)*.65);
          color=mix(color,vec3(1.0,.9,.58),inner*.45);
          if(sculpted>.5){
            float gilded=clamp(direction.z*2.4+.45,0.0,1.0);
            color=mix(vec3(.93,.48,.29),vec3(1.0,.92,.66),gilded);
            if((C.w>8.5&&C.w<9.5)||(C.w>12.5&&C.w<13.5)){
              color=mix(vec3(1.0,.58,.62),vec3(1.0,.9,.71),clamp(direction.z*2.8+.35,0.0,1.0));
              if(mod(aRay,10.0)<2.0)color=vec3(1.0,.85,.34);
            }
          }
          // Front and back grains have distinct brightness and true perspective.
          color*=mix(.7,1.0,clamp(.5+direction.z*2.0,0.0,1.0));
          worldSize=mix(.19,.105,smoothstep(0.0,life,t))*(.85+.25*aRnd.y)*(1.0-.45*aTrail);
          worldSize*=mix(1.0,1.45,grand);
          worldSize*=mix(.72,1.12,aRnd.w);
          alpha*=mix(1.0,.76,sculpted*aTrail);
          // Settled shapes render each grain once; coincident trails wash out color.
          if(sculpted>.5&&aTrail>.01)alpha*=1.0-smoothstep(.4,1.1,t);
          if(sculpted>.5)worldSize*=1.2;
          if(C.w>15.5&&C.w<16.5){worldSize*=.65;alpha*=.7;}
          if(C.w>16.5){worldSize*=.82;alpha*=smoothstep(.6,1.12,t);}
        }
      }
      vec4 mv=modelViewMatrix*vec4(p,1.0),oldView=modelViewMatrix*vec4(previous,1.0);
      vec4 projected=projectionMatrix*mv,oldProjected=projectionMatrix*oldView;
      vec2 velocity=projected.xy/max(.001,projected.w)-oldProjected.xy/max(.001,oldProjected.w);
      float aspect=projectionMatrix[1][1]/projectionMatrix[0][0];
      vAngle=dot(velocity,velocity)>1e-12?atan(velocity.y,velocity.x*aspect):0.0;
      vColor=color;vAlpha=alpha;
      gl_PointSize=alpha>.003?clamp(worldSize*uSizeScale/max(.1,-mv.z),2.5,9.0):0.0;
      gl_Position=projected;
    }`,
  fragmentShader: `
    varying vec3 vColor;varying float vAlpha,vAngle,vTail;
    void main(){
      vec2 p=vec2(gl_PointCoord.x-.5,.5-gl_PointCoord.y);float c=cos(vAngle),s=sin(vAngle);
      vec2 q=vec2(p.x*c+p.y*s,-p.x*s+p.y*c);
      float stretch=mix(.22,.32,vTail);
      float ember=exp(-q.x*q.x/(stretch*stretch)-q.y*q.y/.009);
      float bead=exp(-dot(p,p)*34.0);
      float tip=exp(-dot(p,p)*75.0),halo=exp(-dot(p,p)*22.0)*.12;
      float head=1.0-step(.02,vTail);
      float alpha=(mix(ember*.78,bead*.82,head)+tip*.18+halo)*vAlpha;
      alpha*=1.0-smoothstep(.35,.5,length(p));if(alpha<.007)discard;
      vec3 color=mix(vColor,vec3(1.0,.95,.79),tip*.2);
      gl_FragColor=vec4(color,min(.95,alpha));
    }`
};
