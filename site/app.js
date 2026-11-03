const stages={S1:"Python 基础",S2:"工程与科学计算",S3:"机器学习与深度学习",S4:"序列与 Transformer",S5:"大模型基础与实践",S6:"RAG 与 Agent"};
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let course=[],current,samples=[],busy=false,pythonWorker=null,pythonReady=null,pythonSeq=0,pythonRequest=null,pythonTimer=null,loadTimer=null;
const storage={get(k){try{return localStorage.getItem("zhixing:"+k)}catch{return null}},set(k,v){try{localStorage.setItem("zhixing:"+k,v)}catch{}}};
function inline(t){return esc(t).replace(/\x60([^\x60]+)\x60/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noreferrer">$1</a>');}
function markdown(text){
 let html="",paragraph=[],inCode=false,code=[],lang="",list=false;
 const flush=()=>{if(paragraph.length){html+="<p>"+inline(paragraph.join(" "))+"</p>";paragraph=[]}};
 const close=()=>{if(list){html+="</ul>";list=false}};
 for(const line of text.split("\n")){
  const fence=line.match(/^(?:~~~|\x60{3})(.*)$/);
  if(fence){flush();close();if(!inCode){inCode=true;lang=fence[1].trim();code=[]}else{let raw=code.join("\n"),i=samples.push(raw)-1;html+='<div class="code-sample"><pre>'+esc(raw)+'</pre>'+(/^(python|py)(?:$|\s)/i.test(lang)?'<button data-sample="'+i+'">在练习区修改并运行 ↗</button>':"")+"</div>";inCode=false}continue;}
  if(inCode){code.push(line);continue;}
  if(/^#{1,4}\s/.test(line)){flush();close();html+="<h3>"+inline(line.replace(/^#+\s*/,""))+"</h3>";continue;}
  if(/^\s*[-*]\s/.test(line)){flush();if(!list){html+="<ul>";list=true}html+="<li>"+inline(line.replace(/^\s*[-*]\s/,""))+"</li>";continue;}
  if(!line.trim()){flush();close();continue;}close();paragraph.push(line);
 }
 flush();close();if(inCode)html+='<pre>'+esc(code.join("\n"))+'</pre>';return html;
}
function flow(labels,caption){
 const bw=(650-12*(labels.length-1))/labels.length;
 let svg='<svg viewBox="0 0 650 100" role="img" aria-label="'+esc(caption)+'"><defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="#698174"/></marker></defs>';
 labels.forEach((label,i)=>{let x=i*(bw+12);svg+='<rect x="'+(x+1)+'" y="20" width="'+(bw-2)+'" height="56" rx="5" fill="'+(i===labels.length-1?"#dcebdc":"#eef2eb")+'" stroke="#d3dfd1"/><text x="'+(x+bw/2)+'" y="53" text-anchor="middle" font-size="13" fill="#294e3b">'+esc(label)+'</text>';if(i<labels.length-1)svg+='<path d="M'+(x+bw)+' 48h10" stroke="#698174" marker-end="url(#arrow)"/>';});
 return '<figure class="figure">'+svg+"</svg><figcaption>"+esc(caption)+"</figcaption></figure>";
}
function diagram(l){
 const custom=window.StudyDemos?.render(l);if(custom)return custom;
 if(l.id==="S1-U04")return '<figure class="figure"><div class="slider-row"><label>起点 <input id="slice-start" type="number" min="-5" max="5" value="1"></label><label>终点 <input id="slice-stop" type="number" min="-5" max="6" value="4"></label></div><div id="slice-view"></div><figcaption>改变边界，看 numbers[start:stop] 选中哪些位置；步长固定为 1，终点不包含。</figcaption></figure>';
 if(l.id==="S1-U08")return '<figure class="figure"><svg viewBox="0 0 650 160" role="img" aria-label="赋值与浅拷贝引用关系"><text x="15" y="30">a</text><text x="15" y="75">b = a</text><path d="M85 26L220 50M85 70L220 50" stroke="#567363"/><rect x="220" y="28" width="150" height="48" rx="5" fill="#dcebdc"/><text x="295" y="58" text-anchor="middle">外层列表 A</text><text x="15" y="135">c = a.copy()</text><path d="M130 130h90" stroke="#567363"/><rect x="220" y="106" width="150" height="42" rx="5" fill="#eef2eb"/><text x="295" y="132" text-anchor="middle">外层列表 B</text><path d="M370 50L490 80M370 125L490 80" stroke="#567363"/><rect x="490" y="58" width="150" height="45" rx="5" fill="#e8eee1"/><text x="565" y="86" text-anchor="middle">共享的内层对象</text></svg><figcaption>赋值共享外层；浅拷贝换了外层，却仍可能共享内层。修改哪一层，决定谁会看见变化。</figcaption></figure>';
 if(l.id==="S4-U03")return '<figure class="figure"><div class="slider-row"><label>第一个相关性分数 <input id="score" type="range" min="-3" max="5" step=".25" value="1"></label><span id="score-value">1</span></div><div id="attention-view"></div><figcaption>交互示意：softmax([分数, 1, 0]) 转为和为 1 的权重；本图只解释权重，不代表完整多头注意力。</figcaption></figure>';
 const byId={
 "S2-U02":[["函数与参数","对象方法","迭代协议","还原简写"],"先看输入输出与调用关系，再读注解、生成器和装饰器。"],
 "S2-U03":[["选择解释器","核对 pip","运行脚本","断点观察"],"环境决定能导入哪些包；调试器帮助检查实际变量。"],
 "S3-M01":[["划分数据","仅训练集 fit","分别 transform","Pipeline 预测"],"验证集、测试集不能参与均值、标准差或编码规则的拟合。"],
 "S3-M03":[["一个特征","选择分割阈值","形成左右分支","叶节点预测"],"深树可以记住训练细节；深度选择要看验证结果。"],
 "S3-M05":[["缩放特征","选择簇数 / 维数","拟合训练数据","检查结果"],"聚类发现相似结构，PCA 保留方差方向；两者都不自动产生业务标签。"],
 "S6-E03":[["Python 客户端","连接 MySQL","参数化 SQL","提交 / 回滚"],"MySQL 作为独立服务保存数据；连接、事务与关系查询各有职责。"],
 "S6-E01":[["实验记录","参数化 SQL","事务提交","条件查询"],"将文件中的记录保存为表；查询条件与写入操作要区分。"],
 "S6-E02":[["HTTP 请求","验证 JSON","调用函数","JSON 响应"],"路由决定哪个函数处理请求，验证先于业务处理。"],
 "S1-U01":[["源代码 .py","Python 解释器","实际输出"],"编辑器写代码，解释器执行，终端展示输出。"],
 "S1-U02":[["input 字符串","类型转换","数字运算","格式化输出"],"先确认类型，再判断数值计算与文本操作。"],
 "S1-U03":[["读取一个值","检查条件","执行分支","继续下一项"],"循环提供数据，条件决定这一轮做什么。"],
 "S1-U05":[["文本","lower / split","遍历单词","字典累加"],"旧知识串成第一个可用的词频处理过程。"],
 "S1-U06":[["词频字典","items 键值对","key 排序","编号显示"],"保留计数逻辑，改善结果组织。"],
 "S1-U07":[["实参 text","形参绑定","函数处理","return 结果"],"print 面向阅读者，return 把对象交回后续程序。"],
 "S1-U09":[["UTF-8 文件","字符串","统计函数","JSON 文件"],"输入来源改变时，统计函数继续复用。"],
 "S1-U10":[["main.py 入口","导入 textstats","调用函数","保存结果"],"文件围绕职责划分，区分导入和直接运行。"],
 "S2-U01":[["类的定义","创建实例","self 关联实例","调用方法"],"类组织数据与操作；不同实例可以有自己的状态。"],
 "S2-U04":[["列表数据","数组与 dtype","shape / 索引","复制或视图"],"先明确形状，再判断修改共享了哪一层数据。"],
 "S2-U05":[["检查 shape","对齐尾部维度","广播规则","逐元素结果"],"逐元素运算与矩阵乘法使用不同的形状规则。"],
 "S3-U03":[["输入 x","前向计算 y","损失 L","链式法则 dL/dx"],"梯度说明局部变化率；更新参数是后续单独的一步。"],
 "S3-U08":[["模型与配置","保存状态","重新构建模型","加载后预测"],"权重文件不自动说明所有运行条件，配置与数据处理同样需要保留。"],
 "S5-U04":[["明确任务","给出示例","约束输出","固定样例比较"],"提示的变化需要用相同标准比较，不能只挑成功结果。"],
 "S6-U05":[["模型请求工具","检查参数","执行 Python 函数","结果回传"],"提出调用的是模型，实际运行函数的是程序。"],
 "S6-U06":[["读取状态","选择动作","执行工具","观察结果","结束或继续"],"每一轮检查停止条件，不能把无限循环当成自主能力。"]};
 const defaults={
 S4:[["词元与表示","注意力模块","前馈与残差","输出"],"先标出输入形状，再把各个模块连接起来。"],
 S1:[["已有数据","处理规则","结果"],"用清楚的步骤完成当前问题。"],
 S2:[["原始数据","检查清理","数组 / 表格","统计图形"],"文件、函数与模块继续组织新的数据操作。"],
 S3:[["数据批次","模型预测","损失","梯度","参数更新"],"训练循环：参数更新针对训练数据，评价使用留出数据。"],
 S5:[["文本模板","tokenizer","模型推理","解码","固定评价"],"推理不等于训练；沿用前面的基准与数据划分。"],
 S6:[["问题","检索资料","组织上下文","模型回答","检查依据"],"普通 RAG 需要资料与回答相互对应，工具调用在此基础上增加。"]};
 const f=byId[l.id]||defaults[l.stage];return flow(f[0],f[1]);
}
function wireDiagram(){
 window.StudyDemos?.wire();
 if($("slice-start")){const update=()=>{let a=+$("slice-start").value,b=+$("slice-stop").value,norm=n=>Math.min(5,Math.max(0,n<0?5+n:n)),s=norm(a),e=norm(b);$("slice-view").innerHTML='<svg viewBox="0 0 650 100" role="img" aria-label="切片选中位置">'+[10,20,30,40,50].map((n,i)=>'<rect x="'+(i*128+2)+'" y="15" width="115" height="48" rx="4" fill="'+(i>=s&&i<e?"#bad5b8":"#eef2eb")+'"/><text x="'+(i*128+59)+'" y="45" text-anchor="middle">'+n+'</text><text x="'+(i*128+59)+'" y="88" text-anchor="middle" fill="#7b8e80" font-size="12">索引 '+i+'</text>').join("")+"</svg>"};$("slice-start").oninput=update;$("slice-stop").oninput=update;update();}
 if($("score")){const update=()=>{let v=+$("score").value,m=Math.max(v,1),raw=[v,1,0].map(n=>Math.exp(n-m)),sum=raw.reduce((a,b)=>a+b);$("score-value").textContent=v;$("attention-view").innerHTML='<svg viewBox="0 0 650 130" role="img" aria-label="注意力权重">'+raw.map((n,i)=>{let p=n/sum;return '<text x="0" y="'+(25+i*42)+'" font-size="13">位置 '+i+'</text><rect x="65" y="'+(8+i*42)+'" width="'+(p*475)+'" height="26" rx="3" fill="#82b098"/><text x="'+(75+p*475)+'" y="'+(25+i*42)+'" font-size="12">'+p.toFixed(3)+'</text>'}).join("")+"</svg>"};$("score").oninput=update;update();}
}
function nav(query=""){
 const filtered=course.filter(l=>(l.id+" "+l.title+" "+l.lead+" "+l.body).toLowerCase().includes(query.toLowerCase()));
 $("course-nav").innerHTML=Object.keys(stages).map(s=>{
  let items=filtered.filter(l=>l.stage===s);
  if(!items.length)return "";
  let expanded=Boolean(query)||current?.stage===s,panel="stage-list-"+s;
  return '<section class="stage"><button class="stage-toggle" data-stage="'+s+'" aria-expanded="'+expanded+'" aria-controls="'+panel+'">'+s+' / '+stages[s]+' ('+items.length+')</button><div id="'+panel+'" '+(!expanded?'hidden':"")+'>'+items.map(l=>'<button class="lesson-link '+(l.id===current?.id?"active":"")+'" data-id="'+l.id+'"><span>'+l.id+(l.id.includes("-E")?" · 选修":"")+'</span>'+esc(l.title)+'</button>').join("")+'</div></section>';
 }).join("");
}
function setCourseOpen(open){document.body.classList.toggle("course-open",open);$("menu-toggle").setAttribute("aria-expanded",String(open));}
function setLabOpen(open){document.body.classList.toggle("lab-open",open);$("toggle-lab").setAttribute("aria-expanded",String(open));$("toggle-lab").textContent=open?"返回讲义":"打开练习区";}
function files(items){$("file-list").innerHTML=Object.entries(items).map(([n,b])=>'<p><strong>'+esc(n)+'</strong></p><pre class="file-content">'+esc(b)+'</pre>').join("")||"<p>本课没有预置文件，可在代码中创建小文件。</p>";}
function readingBody(lesson){const html=markdown(lesson.body),anchor=lesson.visualAfter?"<h3>"+inline(lesson.visualAfter)+"</h3>":"<h3>",at=html.indexOf(anchor);const next=html.indexOf("<h3>",at+anchor.length);return next<0?html+diagram(lesson):html.slice(0,next)+diagram(lesson)+html.slice(next);}
function resetPythonWorker(error){clearTimeout(pythonTimer);clearTimeout(loadTimer);pythonWorker?.terminate();pythonWorker=null;pythonReady=null;const request=pythonRequest;pythonRequest=null;if(request)request.reject(error||new Error("浏览器 Python 已重置。"));}
function ensurePythonWorker(){
 if(pythonReady)return pythonReady;
 pythonWorker=new Worker("./pyodide-worker.js",{type:"module"});
 pythonReady=new Promise((resolve,reject)=>{
  pythonWorker.onmessage=event=>{
   const data=event.data||{};
   if(data.type==="ready"){clearTimeout(loadTimer);resolve();return;}
   if(data.type==="fatal"){reject(new Error(data.error||"Pyodide 加载失败。"));resetPythonWorker();return;}
   if(pythonRequest&&data.id===pythonRequest.id){clearTimeout(pythonTimer);const request=pythonRequest;pythonRequest=null;data.error?request.reject(new Error(data.error)):request.resolve(data.result);}
  };
  pythonWorker.onerror=event=>{const error=new Error(event.message||"浏览器 Python Worker 加载失败。");reject(error);resetPythonWorker(error);};
  loadTimer=setTimeout(()=>{const error=new Error("首次加载 Pyodide 超时，请检查网络后重试。");reject(error);resetPythonWorker(error);},90000);
 });
 return pythonReady;
}
async function executeInPythonWorker(payload){
 await ensurePythonWorker();
 return new Promise((resolve,reject)=>{
  const id=++pythonSeq;pythonRequest={id,resolve,reject};
  pythonTimer=setTimeout(()=>{const error=new Error("执行超过 15 秒，已停止。");error.timeout=true;resetPythonWorker(error);},15000);
  pythonWorker.postMessage({...payload,id});
 });
}
function practiceGuide(l){
 const p=l.practicePlan,j=l.project;if(!p||!j)return "";
 const scripts=Object.keys(l.practiceFiles||{}).filter(name=>name.endsWith(".py"));
 return '<section class="practice-guide"><h2>在 VS Code 完成这一步</h2><p>先在网页练习区完成本课示例和改动任务，再下载本课实践包，在 VS Code 中继续。</p><p><strong>自己修改：</strong>'+esc(p.change)+'</p><p><strong>文件怎么用：</strong>解压后先读“开始实践.md”，从“起始示例.py”复制一份，保留自己的实现。'+(scripts.length?'本课另有 '+scripts.map(n=>'<code>'+esc(n)+'</code>').join('、')+'，按目录中的 README 准备环境，再复制一份改写。':'')+'</p><button data-open="lesson">下载本课 VS Code 练习包</button><p><strong>后面接着用：</strong>'+esc(p.transfer)+'</p><details><summary>阶段项目：'+esc(j.title)+' · '+esc(j.after)+' 后整合</summary><p>'+esc(j.carry)+'</p><p>项目包包含完整示例、动手版、数据和使用说明。</p><button data-open="project">下载阶段项目</button></details></section>';
}
function showMap(){
 current=null;samples=[];document.body.classList.add("is-map");setLabOpen(false);setCourseOpen(false);
 $("breadcrumb").textContent="学习全景 / 50 必修 · 4 选修";
 $("reading").innerHTML=window.LearningMap.render(course,stages,esc,storage.get("last"));
 $("download").disabled=true;$("toggle-lab").hidden=true;nav($("search").value);window.scrollTo(0,0);
}
function show(id){
 if(id==="map"||!id){showMap();return;}
 document.body.classList.remove("is-map");setLabOpen(false);setCourseOpen(false);$("download").disabled=false;$("toggle-lab").hidden=false;
 const found=course.find(l=>l.id===id);if(!found){if(course.length)show(course[0].id);return;}current=found;samples=[];document.body.dataset.stage=current.stage;
 $("breadcrumb").textContent=stages[current.stage]+" / "+current.id+" · "+course.length+" 课（含选修）";
 $("reading").innerHTML='<div class="eyebrow">'+current.id+' / '+stages[current.stage]+'</div><h1>'+esc(current.title)+'</h1><p class="lead">'+esc(current.lead)+'</p><div class="carry"><strong>接着用：</strong>'+esc(current.prior)+'<br><strong>本次要做到：</strong>'+esc(current.goal)+'</div>'+'<div class="prose">'+readingBody(current)+'</div>'+practiceGuide(current)+'<div class="check"><strong>现在能继续了吗？</strong><br>'+esc(current.check)+'</div><details class="sources"><summary>本课来源与使用边界</summary><p>本课为针对你重写的讲义。标准库初始实验已执行核对；框架实践需按正文准备环境，不表示已经验证全部外部模型。</p>'+current.sources.map(s=>'<a href="'+esc(s)+'" target="_blank" rel="noreferrer">'+esc(s)+'</a><br>').join("")+'</details><div class="paging"><button id="previous">← 上一课</button><button id="next">下一课 →</button></div>';
 $("code").value=storage.get(current.id)??current.starter;$("stdin").value=storage.get(current.id+":stdin")??current.stdin??"";$("expected").textContent=current.expected;$("task").textContent=current.task;$("hint").textContent=current.hint;$("solution-code").textContent=current.solution;$("solution-code").hidden=true;$("solution").setAttribute("aria-expanded","false");$("output").textContent="先预测，再运行代码。";$("run-status").textContent="代码草稿保存在此浏览器；每次运行使用新的临时目录。";files(current.files||{});
 const i=course.indexOf(current),next=current.id.includes("-E")?course[i+1]:course.slice(i+1).find(l=>!l.id.includes("-E"));
 $("previous").disabled=i===0;$("next").disabled=!next;$("next").textContent=next?"下一课 →":"已到主线末课";
 $("previous").onclick=()=>location.hash=course[i-1].id;$("next").onclick=()=>{if(next)location.hash=next.id};
 
 $("vscode-link").href=current.practiceDownload||"#";
 $("vscode-status").textContent="下载后解压，在 VS Code 中打开文件夹。需要 PyTorch 或真实模型依赖时，请在本机运行。";
 const refs=current.visualRefs||[];
 if(refs.length)$("reading").querySelector(".sources").insertAdjacentHTML("beforebegin",'<details class="sources"><summary>延伸可视化：看另一个具体演示</summary>'+refs.map(r=>'<p><a href="'+esc(r.url)+'" target="_blank" rel="noreferrer">'+esc(r.title)+'</a><br>'+esc(r.reason)+'</p>').join("")+'</details>');
nav($("search").value);wireDiagram();storage.set("last",id);window.scrollTo(0,0);
}
$("course-nav").onclick=e=>{let b=e.target.closest("[data-id]"),s=e.target.closest("[data-stage]");if(b)location.hash=b.dataset.id;else if(s){let panel=s.nextElementSibling;panel.hidden=!panel.hidden;s.setAttribute("aria-expanded",String(!panel.hidden));}};
$("reading").onclick=e=>{let jump=e.target.closest("[data-map-scroll]");
 if(jump){$("tree-"+jump.dataset.mapScroll).scrollIntoView({block:"start"});return;}
 let projectOpen=e.target.closest("[data-map-open]");
 if(projectOpen){openWorkspace(true,course.find(l=>l.stage===projectOpen.dataset.mapOpen));return;}
 let project=e.target.closest("[data-project-stage]");
 if(project){
  const l=course.find(l=>l.stage===project.dataset.projectStage),j=l.project,box=$("map-project");
  box.hidden=false;box.innerHTML='<h2>'+esc(j.title)+'</h2><p>'+esc(j.carry)+'</p><p>学到 '+esc(j.after)+' 后完成整合。项目包包含动手版、完整示例和使用说明。</p><button data-map-open="'+l.stage+'">下载阶段项目包</button>';
  box.scrollIntoView({block:"center"});return;
 }
 let open=e.target.closest("[data-open]");if(open){openWorkspace(open.dataset.open==="project");return;}let b=e.target.closest("[data-sample]");if(b){$("code").value=samples[+b.dataset.sample];storage.set(current.id,$("code").value);$("run-status").textContent="已载入讲义片段。需要前文变量的例子请补齐上下文；PyTorch 等本机依赖请下载练习包后在 VS Code 中运行。";$("code").focus();if(innerWidth<1180)setLabOpen(true);}};
$("code").oninput=()=>storage.set(current.id,$("code").value);
$("code").onkeydown=e=>{if(e.key==="Tab"){e.preventDefault();let t=e.target;t.setRangeText("    ",t.selectionStart,t.selectionEnd,"end");storage.set(current.id,t.value)}if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();run()}};
async function run(){
 if(busy||!current)return;busy=true;$("run").disabled=true;let id=current.id;$("run-status").textContent="Python 正在执行…";$("output").textContent="";
 try{let data=await executeInPythonWorker({id,code:$("code").value,stdin:$("stdin").value,files:current.files||{}});if(current?.id!==id)return;$("output").textContent=(data.stdout||"")+(data.stderr?"\n"+data.stderr:"")+(data.error?"\n"+data.error:"")||"程序没有打印内容。表达式需要 print 才会显示。";$("run-status").textContent=data.exitCode===0?"执行完成。请试着解释结果，再改一个条件。":"出现 Python 错误：先读最后一行，再找对应代码位置。PyTorch 等不支持的本机依赖，请下载练习包后在 VS Code 中运行。";files(data.files||{});}
 catch(error){$("run-status").textContent=error.timeout?"执行超过 15 秒，已停止。长任务请下载项目包在本机运行。":"浏览器 Python 未能启动；首次运行需要联网加载 Pyodide，请检查网络后重试。";$("output").textContent=error.message||"浏览器 Python 运行器暂时不可用。"}finally{busy=false;$("run").disabled=false;}
}
$("run").onclick=run;$("reset").onclick=()=>{$("code").value=current.starter;$("stdin").value=current.stdin||"";storage.set(current.id,current.starter);storage.set(current.id+":stdin",current.stdin||"");$("run-status").textContent="已还原初始实验。"};
$("solution").onclick=()=>{const open=$("solution-code").hidden;$("solution-code").hidden=!open;$("solution").setAttribute("aria-expanded",String(open));};$("print").onclick=()=>window.print();
$("toggle-lab").onclick=()=>setLabOpen(!document.body.classList.contains("lab-open"));
$("download").onclick=()=>{let url=URL.createObjectURL(new Blob([$("code").value],{type:"text/x-python;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download=current.id+"_我的实验.py";a.click();URL.revokeObjectURL(url)};
$("search").oninput=()=>nav($("search").value);window.onhashchange=()=>show(location.hash.slice(1));
fetch("./content/course.json").then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{course=data.lessons;$("runtime").textContent="Python · Pyodide";show(location.hash.slice(1)||"map")}).catch(()=>{$("reading").innerHTML='<div class="notice"><h1>课程暂时无法读取</h1><p>请确认网页资源加载完成后刷新。浏览器运行 Python 首次需要联网加载 Pyodide。</p></div>';});

$("stdin").oninput=()=>storage.set(current.id+":stdin",$("stdin").value);
async function openWorkspace(project=false,lesson=current){
 if(!lesson)return;const url=project?lesson.project?.download:lesson.practiceDownload;if(!url){$("vscode-status").textContent="未找到对应下载包。";return;}const link=document.createElement("a");link.href=url;link.download="";document.body.append(link);link.click();link.remove();$("vscode-status").textContent="实践包已开始下载。解压后用 VS Code 打开其中的文件夹。";
}
$("open-vscode").onclick=()=>openWorkspace();


$("menu-toggle").onclick=()=>setCourseOpen(!document.body.classList.contains("course-open"));

$("home").onclick=()=>{if(location.hash==="#map")showMap();else location.hash="map"};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("lab-open")){setLabOpen(false);$("toggle-lab").focus();}});
