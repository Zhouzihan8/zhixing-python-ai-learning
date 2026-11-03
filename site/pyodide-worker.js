import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";

const pyodideReady = loadPyodide();
const encoder = new TextEncoder();
const decoder = new TextDecoder();

pyodideReady.then(() => self.postMessage({ type: "ready" })).catch(error => {
  self.postMessage({ type: "fatal", error: String(error) });
});

function safeRelativePath(name) {
  const normalized = String(name).replaceAll("\\", "/");
  const parts = normalized.split("/");
  if (!normalized || normalized.startsWith("/") || parts.some(part => !part || part === "." || part === "..")) {
    throw new Error("课程文件路径无效：" + name);
  }
  return normalized;
}

function removeTree(pyodide, path) {
  const fs = pyodide.FS;
  for (const name of fs.readdir(path)) {
    if (name === "." || name === "..") continue;
    const child = `${path}/${name}`;
    const stat = fs.stat(child);
    if (fs.isDir(stat.mode)) removeTree(pyodide, child);
    else fs.unlink(child);
  }
  fs.rmdir(path);
}

function collectFiles(pyodide, path, files) {
  const fs = pyodide.FS;
  for (const name of fs.readdir(path)) {
    if (name === "." || name === "..") continue;
    const child = `${path}/${name}`;
    const stat = fs.stat(child);
    if (fs.isDir(stat.mode)) {
      collectFiles(pyodide, child, files);
      continue;
    }
    if (!/\.(json|txt|csv)$/i.test(name) || stat.size > 100000) continue;
    const relative = child.slice(path.length + 1);
    files[relative] = decoder.decode(fs.readFile(child));
  }
}

self.onmessage = async event => {
  const { id, code, stdin = "", files = {} } = event.data || {};
  let pyodide;
  let runDirectory;
  const output = { stdout: [], stderr: [] };
  try {
    pyodide = await pyodideReady;
    await pyodide.loadPackagesFromImports(code);
    runDirectory = `/tmp/zhixing-${id}-${Date.now()}`;
    pyodide.FS.mkdirTree(runDirectory);

    for (const [name, content] of Object.entries(files)) {
      const relative = safeRelativePath(name);
      const target = `${runDirectory}/${relative}`;
      const parent = target.slice(0, target.lastIndexOf("/"));
      pyodide.FS.mkdirTree(parent);
      pyodide.FS.writeFile(target, encoder.encode(String(content)));
    }

    const scriptPath = `${runDirectory}/experiment.py`;
    pyodide.FS.writeFile(scriptPath, encoder.encode(String(code)));
    pyodide.FS.chdir(runDirectory);
    const inputText = String(stdin).replace(/\r\n/g, "\n");
    const inputLines = inputText === "" ? [] : inputText.split("\n");
    pyodide.setStdin({ stdin: () => inputLines.length ? inputLines.shift() : null, isatty: false });
    pyodide.setStdout({ batched: text => output.stdout.push(text) });
    pyodide.setStderr({ batched: text => output.stderr.push(text) });

    const namespace = await pyodide.runPythonAsync(
      `import runpy\nrunpy.run_path(${JSON.stringify(scriptPath)}, run_name="__main__")`
    );
    namespace?.destroy?.();
    const generated = {};
    collectFiles(pyodide, runDirectory, generated);
    self.postMessage({ id, result: { stdout: output.stdout.join("\n"), stderr: output.stderr.join("\n"), exitCode: 0, files: generated } });
  } catch (error) {
    self.postMessage({ id, result: { stdout: output.stdout.join("\n"), stderr: output.stderr.join("\n"), error: String(error), exitCode: 1, files: {} } });
  } finally {
    if (pyodide && runDirectory) {
      try { pyodide.FS.chdir("/"); removeTree(pyodide, runDirectory); } catch { /* the worker is discarded on timeout */ }
    }
  }
};
