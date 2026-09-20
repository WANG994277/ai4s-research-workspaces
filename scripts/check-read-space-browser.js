const base=process.env.READ_SPACE_BASE_URL || 'http://localhost:3000';
/* Run with PLAYWRIGHT_MODULE pointing to an installed playwright package. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const output = path.resolve('docs/read-space/qa');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const results=[];
  const open = async (url) => { await page.close(); page = await context.newPage(); page.setDefaultTimeout(20000); page.on('pageerror', e => errors.push(e.message)); await page.goto(url, {waitUntil:'domcontentloaded'}); };
  const check=(name)=>{results.push(name);console.log('PASS:',name);};
  try {
    await open(base+'/read-space');
    await page.getByRole('heading',{name:'AI4S 读空间',exact:true}).waitFor();
    assert.equal(await page.locator('.rs-agent-card').count(),6);
    assert.equal(await page.locator('.rs-quick button').count(),8);
    await page.screenshot({path:path.join(output,'home-desktop.png')});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    check('Homepage at 1440px; all six agents and eight task templates rendered');
    if(process.argv.includes('--notes-only')) {
      await page.getByRole('button',{name:'研究笔记',exact:true}).click();
      await page.getByRole('dialog').waitFor();
      await page.getByRole('button',{name:'新增人工笔记',exact:true}).click();
      await page.getByRole('textbox',{name:'编辑人工笔记',exact:true}).fill('独立研究判断记录');
      await page.keyboard.press('Escape');
      await page.reload();
      await page.getByRole('button',{name:'研究笔记 1',exact:true}).click();
      assert.equal(await page.getByRole('textbox',{name:'编辑人工笔记',exact:true}).inputValue(),'独立研究判断记录');
      check('Research context notebook opens, creates editable human note and restores on reload');
      return;
    }
    if(process.argv.includes('--home-only')) {
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:path.join(output,'home-mobile.png')});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      check('Homepage at 390px without horizontal document overflow');
      return;
    }
    await page.getByRole('textbox',{name:'科研问题',exact:true}).fill('高温高压环境如何影响页岩裂缝扩展？');
    await page.getByRole('button',{name:'开始研究',exact:true}).click();
    await page.getByRole('heading',{name:'高温高压环境如何影响页岩裂缝扩展？',exact:true}).waitFor();
    const agentUrl=page.url();
    await page.getByRole('button',{name:'开始研究',exact:true}).click();
    await page.getByRole('button',{name:'全部保留',exact:true}).waitFor();
    await page.getByRole('button',{name:'全部保留',exact:true}).click();
    await page.getByRole('button',{name:'确认候选假设并继续',exact:true}).waitFor();
    await page.getByRole('button',{name:'确认候选假设并继续',exact:true}).click();
    await page.getByText('研究流程已完成。5 个产物和 3 条来源证据已保存，可继续验证与撰写报告。',{exact:true}).waitFor();
    await page.reload();
    await page.getByRole('tab',{name:'科学假设',exact:true}).click();
    await page.screenshot({path:path.join(output,'agent-desktop.png')});
    check('Research execution, two confirmation gates, five artifacts and reload recovery');
    await page.getByRole('button',{name:'用于计算验证',exact:true}).click();
    await page.getByRole('heading',{name:'科研计算任务草稿',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'确认并进入算空间',exact:true}).isDisabled(),true);
    await page.getByRole('checkbox').check();
    await page.getByRole('button',{name:'确认并进入算空间',exact:true}).click();
    await page.waitForURL(/\/compute-space\?/);
    await open(page.url());
    await page.getByText('已接收读空间研究上下文',{exact:true}).waitFor({timeout:60000});
    await page.getByRole('button',{name:'生成计算方案',exact:true}).click();
    await page.waitForURL(/compute-space\/agent\?plan=/);
    check('Read → compute draft, explicit confirmation, native compute workspace receives goal, hypothesis and evidence');
    await open(agentUrl);
    await page.getByRole('tab',{name:'科学假设',exact:true}).click();
    await page.getByRole('button',{name:'用于实验验证',exact:true}).click();
    await page.getByRole('checkbox').check();
    await page.getByRole('button',{name:'确认并进入做空间',exact:true}).click();
    await page.waitForURL(/\/do-space\?/);
    await open(page.url());
    await page.getByText('已接收读空间研究目标、假设、方法、参数与证据。',{exact:true}).waitFor();
    assert.equal(await page.getByRole('textbox',{name:'实验目标',exact:true}).inputValue(),'高温高压环境如何影响页岩裂缝扩展？');
    await page.getByRole('button',{name:'生成实验方案',exact:true}).click();
    await page.waitForURL(/\/do-space\/agent\?/);
    check('Read → experiment draft, human confirmation and native experiment plan generation');
    await open(base+'/read-space/tasks?projectId=PROJ-PE-02');
    await page.getByText('还没有研究任务',{exact:true}).waitFor();
    check('Project switching does not leak tasks from another project');
    await open(base+'/read-space');
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('heading',{name:'AI4S 读空间',exact:true}).waitFor();
    await page.screenshot({path:path.join(output,'home-mobile.png')});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    check('Mobile homepage has no horizontal document overflow');
    fs.writeFileSync(path.join(output,'storage.json'),JSON.stringify(await context.storageState(),null,2));
    assert.deepEqual(errors,[],'Browser runtime errors');
  } catch (error) {
    await page.screenshot({path:path.join(output,'core-failure.png')});
    fs.writeFileSync(path.join(output,'core-failure.txt'),await page.locator('body').innerText());
    throw error;
  } finally {
    fs.writeFileSync(path.join(output,process.argv.includes('--notes-only')?'notes-results.json':'results.json'),JSON.stringify({results,errors},null,2));
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
