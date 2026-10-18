// Every numeric UI control must start with a finite number.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(require.resolve('../web/app.js'),'utf8');
const d=src.match(/const defaults=(.*?);/s)[1],r=src.match(/const ranges=(\[.*?\]);/s)[1];
const context=vm.createContext({});vm.runInContext(`var defaults=${d};var ranges=${r};`,context);
for(const [,key]of context.ranges)assert.ok(Number.isFinite(context.defaults[key]),`Missing numeric default: ${key}`);
assert.equal(context.defaults.p2,0);console.log('All numeric controls have finite defaults.');
