// Exercise the actual viewer upload contract with an atlas from the server.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{},LensQuality:require('../web/quality.js'),Float32Array};
vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../web/gpu.js'),'utf8'),context);
const data=JSON.parse(fs.readFileSync(0,'utf8')),uploads=[];
const gl={MAX_ARRAY_TEXTURE_LAYERS:1,NO_ERROR:0,getParameter:()=>1024,getError:()=>0,
 pixelStorei(){},activeTexture(){},bindTexture(){},texParameteri(){},
 texImage3D(...args){uploads.push(args);}};
const viewer={gl,rayTexture:{},pupilTexture:{},ready:false};
context.window.LensGPU.prototype.setKernel.call(viewer,data);
assert.equal(viewer.ready,true);assert.equal(viewer.data,data);assert.equal(uploads.length,2);
for(const args of uploads){assert.equal(args[3],data.grid*3);assert.equal(args[4],data.grid);assert.equal(args[5],data.taps);assert.equal(args[9].length,data.atlas.length);assert.ok(args[9].every(Number.isFinite));}
assert.throws(()=>context.window.LensGPU.prototype.setKernel.call(viewer,{...data,grid:7}),/Atlas de raios inválido/);
