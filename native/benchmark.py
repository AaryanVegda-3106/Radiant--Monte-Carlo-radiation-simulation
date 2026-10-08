"""Repeat a matched native strong-scaling experiment; stdout is importable JSON."""
import argparse, json, subprocess, sys, time
p=argparse.ArgumentParser()
p.add_argument('--exe',default='./build/radiant')
p.add_argument('--n',type=int,default=1000000)
p.add_argument('--seed',type=int,default=42)
p.add_argument('--thickness',type=float,default=10)
p.add_argument('--sigma',type=float,default=.35)
p.add_argument('--absorb',type=float,default=.25)
p.add_argument('--energy',type=float,default=1)
p.add_argument('--threads',type=int,nargs='+',default=[1,2,4])
p.add_argument('--ranks',type=int,nargs='+',default=[1])
p.add_argument('--mpi',action='store_true')
p.add_argument('--environment',choices=['local','hpc'],default='local')
p.add_argument('--repeats',type=int,default=3)
p.add_argument('--output',default='measurements.json')
a=p.parse_args()
if a.repeats<1 or any(v<1 for v in a.ranks+a.threads):p.error('counts must be positive')
if max(a.ranks)>1 and not a.mpi:p.error('multiple ranks require --mpi and an MPI build')
records=[]; baseline=None
for ranks in a.ranks:
 for threads in a.threads:
  for repeat in range(a.repeats):
   cmd=(["mpirun","-np",str(ranks)] if a.mpi else [])+[a.exe,*map(str,[a.n,a.seed,a.thickness,a.sigma,a.absorb,a.energy,threads]),a.environment]
   started=time.perf_counter(); result=subprocess.run(cmd,check=True,capture_output=True,text=True)
   sys.stderr.write(result.stderr)
   r=json.loads(result.stdout);r['launchWallSeconds']=time.perf_counter()-started
   if r['ranks']!=ranks:raise RuntimeError('Executable is not using the requested MPI ranks')
   if baseline is None:baseline=r['counts']
   if r['counts']!=baseline:raise RuntimeError('Outcome mismatch across reproducible native workloads')
   records.append(r)
   # Durable checkpoint after each fully completed measurement.
   with open(a.output,'w',encoding='utf-8') as f:json.dump({'schema':1,'records':records},f,indent=2)
   print(f"{ranks} ranks × {threads} threads, repeat {repeat+1}: {r['wallSeconds']:.6f}s",file=sys.stderr)
print(json.dumps({'schema':1,'records':records}))
