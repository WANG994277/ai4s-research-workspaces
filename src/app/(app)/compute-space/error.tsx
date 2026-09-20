'use client';
export default function Error({reset}:{reset:()=>void}){return <div className="p-8"><h2 className="mb-3 font-semibold">算空间暂时无法加载</h2><p className="mb-4 text-sm text-muted-foreground">演示数据保存在当前浏览器，可重新加载后继续。</p><button onClick={reset} className="rounded-md bg-primary px-4 py-2 text-white">重新加载</button></div>}
