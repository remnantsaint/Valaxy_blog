import{d as x,z as T,an as $,D as C,G as Y,l as y,ao as _,o as c,b as m,f as n,g as e,v as i,x as f,h as a,F as z,y as w,ap as M,r as D,S as V,m as I,s as S,c as A,w as F,_ as J}from"./app-C9bLnyWR.js";function R(l,s){return Math.random()*(s-l)+l}function X(l,s){let r,t=!1;return()=>{r&&clearTimeout(r),t?r=setTimeout(l,s):(l(),t=!0,setTimeout(()=>{t=!1},s))}}const N={class:"va-footer p-4 text-$va-c-text-light",text:"center sm"},j={key:0,class:"beian",m:"y-2"},B={href:"https://beian.miit.gov.cn/",target:"_blank",rel:"noopener"},H={class:"copyright flex justify-center items-center gap-2",p:"1"},L=["href","title"],U={key:1,class:"powered",m:"2"},W=["innerHTML"],q=["href","title"],E=x({__name:"YunFooter",setup(l){const{t:s}=T(),r=$(),t=C(),o=Y(),u=new Date().getFullYear(),v=y(()=>u===o.value.footer.since),g=y(()=>s("footer.powered",[`<a href="${_.repository.url}" target="_blank" rel="noopener">Valaxy</a> v${_.version}`])),p=y(()=>o.value.footer.icon||{url:_.repository.url,name:"i-ri-cloud-line",title:_.name});return(h,d)=>{var b,k;return c(),m("footer",N,[(b=n(o).footer.beian)!=null&&b.enable&&n(o).footer.beian.icp?(c(),m("div",j,[e("a",B,i(n(o).footer.beian.icp),1)])):f("v-if",!0),e("div",H,[e("span",null,[d[0]||(d[0]=a(" © ")),v.value?f("v-if",!0):(c(),m(z,{key:0},[a(i(n(o).footer.since)+" - ",1)],64)),a(" "+i(n(u)),1)]),(k=n(o).footer.icon)!=null&&k.enable?(c(),m("a",{key:0,class:w(["inline-flex",n(o).footer.icon.animated?"animate-pulse":""]),href:p.value.url,target:"_blank",title:p.value.title},[e("div",{class:w(p.value.name)},null,2)],10,L)):f("v-if",!0),e("span",null,i(n(t).author.name),1)]),n(o).footer.powered?(c(),m("div",U,[e("span",{innerHTML:g.value},null,8,W),d[1]||(d[1]=a(" | ")),e("span",null,[a(i(n(s)("footer.theme"))+" - ",1),e("a",{href:n(o).pkg.repository.url,title:n(o).pkg.name,target:"_blank"},i(M(n(r).theme)),9,q),a(" v"+i(n(o).pkg.version),1)])])):f("v-if",!0),D(h.$slots,"default")])}}}),G={class:"live-time-container"},K={class:"live-time-text"},P=x({__name:"YunFooter",setup(l){V("//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js");const s=I("");return S(()=>{const r=new Date("2022-12-27").getTime(),t=()=>{const u=new Date().getTime()-r,v=Math.floor(u/(1e3*60*60*24)),g=Math.floor(u%(1e3*60*60*24)/(1e3*60*60)),p=Math.floor(u%(1e3*60*60)/(1e3*60)),h=Math.floor(u%(1e3*60)/1e3);s.value=`${v}天${g}小时${p}分钟${h}秒`};t(),setInterval(t,1e3)}),(r,t)=>(c(),A(E,null,{default:F(()=>[f(" 添加新的版权信息和样式 "),t[0]||(t[0]=e("div",{class:"footer-info"},[e("span",null,"由 "),e("a",{href:"https://github.com/YunYouJun/valaxy",target:"_blank",style:{color:"#ff69b4","text-decoration":"none"}},"Valaxy"),e("span",null," v0.19.12 驱动 | 主题 - "),e("a",{href:"https://github.com/YunYouJun/valaxy/tree/main/packages/valaxy-theme-yun",target:"_blank",style:{color:"#ff69b4","text-decoration":"none"}},"Yun"),e("span",null," v0.19.12")],-1)),t[1]||(t[1]=e("div",{class:"copyright"},[e("a",{href:"https://icp.gov.moe/?keyword=20231227",target:"_blank"}," 萌ICP备20231227号")],-1)),t[2]||(t[2]=e("div",null,[a("本站总访问量 "),e("span",{id:"busuanzi_value_site_pv"}),a(" 次   本站访客数 "),e("span",{id:"busuanzi_value_site_uv"}),a(" 人次")],-1)),e("div",G,[e("span",K,"本站已运行 "+i(s.value)+" 喵~",1)]),f(`
    <footer style="display: flex; justify-content: center; align-items: center;">
      <a href="https://www.travellings.cn/go.html" target="_blank" rel="noopener" title="开往-友链接力">
        <img src="https://www.travellings.cn/assets/logo.gif" alt="开往-友链接力" width="80">
      </a>
    </footer>
  
    <footer style="display: flex; justify-content: center; align-items: center;">
      <a href="https://clustrmaps.com/site/1c1rl"  title="Visit tracker"><img src="//www.clustrmaps.com/map_v2.png?d=SdKJZpvyUWUfIW1vNm9mAQXARJ7Aa9Nmga5DueqJAk0&cl=ffffff" /></a>
    </footer>
  `)]),_:1}))}}),Z=J(P,[["__scopeId","data-v-911bde66"]]);export{Z as _,R as r,X as t};