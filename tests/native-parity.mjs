import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chunk} from '../dist/engine.js';
const exe=process.argv[2];if(!exe)throw Error('Pass path to compiled radiant executable');
for(const [sigma,absorb] of [[.35,.25],[0,.25],[.35,1],[.35,0]]){const p={n:100000,seed:42,thickness:10,sigma,absorb,energy:1},js=chunk(p,0,p.n);for(const threads of [1,2,4]){const r=JSON.parse(execFileSync(exe,[p.n,p.seed,p.thickness,sigma,absorb,p.energy,threads,'local'].map(String),{encoding:'utf8'}));for(const k of ['transmitted','absorbed','reflected','capped','scatter','collisions'])assert.equal(r.counts[k],js[k],`${k}: ${threads} threads`);assert.deepEqual(r.depth,js.depth);assert.equal(r.energy.deposited+r.energy.escaped+r.energy.residual,p.n);assert.equal(r.workers,threads);}console.log(`PASS native/JS parity: sigma=${sigma}, absorption=${absorb}`);}
