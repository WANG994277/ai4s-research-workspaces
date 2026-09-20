async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3000/do-space/bookings?projectId=PROJ-CCUS-01');
 await page.getByRole('button',{name:/2026-09-21 8:00 已预约/}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
 if(!await page.getByRole('button',{name:'提交预约',exact:true}).isDisabled())throw new Error('冲突预约未阻断');
 await page.getByRole('button',{name:/场发射扫描电镜 SEM/}).click();
 if(!await page.getByRole('button',{name:'提交预约',exact:true}).isDisabled())throw new Error('维护设备未阻断');
 const redirects=[];
 for(const route of ['experiment-design','experiment-plans','experiment-log','experiment-analysis','lab-resources','lab-resources/reservations','experiments','experiments/orchestrator']){
  await page.goto('http://localhost:3000/'+route+'?projectId=PROJ-CCUS-01');
  await page.locator('.do-space h1').first().waitFor();
  if(!page.url().includes('/do-space'))throw new Error('旧入口未转发：'+route);
  redirects.push({route,url:page.url()});
 }
 await page.goto('http://localhost:3000/do-space?projectId=PROJ-PE-02');
 await page.getByText('当前课题还没有实验方案').waitFor();
 const scoped=await page.getByRole('button',{name:'CO₂ 加氢制甲醇催化剂温压梯度验证',exact:true}).count()===0;
 await page.goto('http://localhost:3000/do-space?projectId=PROJ-CCUS-01');
 await page.getByRole('heading',{name:'今天想设计什么实验？',exact:true}).waitFor();
 await page.setViewportSize({width:1440,height:1050});
 await page.locator('main').evaluate(el=>el.scrollTop=0);
 await page.screenshot({path:'output/playwright/do-home-final.png'});
 return {redirects,scoped,errors};
}
