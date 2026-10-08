import {chunk} from './engine.js';
self.onmessage=({data:{p,start,end,worker}})=>{const t=performance.now();try{const result=chunk(p,start,end);self.postMessage({result,start,end,worker,ms:performance.now()-t});}catch(e){self.postMessage({error:e.message,worker});}};
