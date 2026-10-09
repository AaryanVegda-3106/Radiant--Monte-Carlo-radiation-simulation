# RADIANT · Monte Carlo Transport Lab

A working educational simulator, styled from the supplied dark RADIANT dashboard reference. All requested histories are calculated; visualization keeps only history IDs 0–383. Browser sequential and multicore runs use one or several dedicated Web Workers. The C++ engine supports actual OpenMP and optional MPI.

## Run the dashboard

Install a current Node.js release, open a terminal in this folder, and run:

```sh
npm start
```

Open http://127.0.0.1:4173. No npm dependencies or build step. You can also serve `dist/` with any static HTTP server. Opening the HTML directly as a file will not allow module workers. Google Fonts is optional; local fallbacks work offline. No simulation data is sent to a server.

1. Choose histories, material illustration, slab thickness, energy, seed and execution workers.
2. Run. View sampled paths, exact aggregate outcomes, absorption heatmap and collision histogram.
3. Inspect **Behind the Computation** for actual random draws, chunk assignments, logs and timing.
4. Pause and export a checkpoint; import it to calculate remaining chunks. Exporting during a run captures only completed chunks. Resumed timing excludes time spent paused and is marked separately, so it is not used as a scaling baseline.
5. Run **Benchmark & HPC** for 27 measurements: 10K/100K/1M × 1/2/4 workers × 3 repeats. The table reports median runtime and observed min/max. Export your measurements before closing the page; results are not persisted automatically.

## Native CPU / OpenMP

Requires a C++11 compiler with OpenMP and CMake ≥3.16. On Linux install your distribution's C++ compiler, CMake and optionally Open MPI development tools. On Windows use a current MinGW-w64 or Visual Studio C++ toolchain.

```sh
cmake -S native -B native/build -DCMAKE_BUILD_TYPE=Release
cmake --build native/build --config Release
./native/build/radiant 1000000 42 10 0.35 0.25 1 4 local > run.json
python3 native/benchmark.py --exe ./native/build/radiant --n 1000000 --threads 1 2 4 --output local-measurements.json
```

Windows executable paths typically end in `.exe`, and multi-configuration builds may use `native/build/Release/radiant.exe`. Use `python` if that is your Python command. Arguments in order: **histories, seed, thickness (cm), total cross section (cm⁻¹), absorption probability, energy (MeV), threads, environment label**. Environment is `local` or `hpc`, supplied by the operator; it is not remote access or independent attestation.

Import JSON with the dashboard's **Import native / HPC JSON** control. The benchmark runner saves completed measurements after each run and fails if integer outcomes differ across thread/rank counts. It requires only Python's standard library.

## MPI / real cluster

```sh
cmake -S native -B native/build-mpi -DRADIANT_MPI=ON -DCMAKE_BUILD_TYPE=Release
cmake --build native/build-mpi -j 4
export OMP_PROC_BIND=close
export OMP_PLACES=cores
mpirun -np 4 ./native/build-mpi/radiant 10000000 42 10 0.35 0.25 1 4 hpc > hpc-run.json
python3 native/benchmark.py --exe ./native/build-mpi/radiant --mpi --environment hpc --ranks 1 2 4 --threads 1 2 4 --n 10000000 --output hpc-measurements.json
```

`native/run.slurm` is an example allocation and sweep, not a universal submission script. Adapt compiler/MPI modules, partition/account, launcher and binding to your cluster. Do not oversubscribe the allocation. With four ranks and four threads, reserve sixteen CPU cores. MPI ranks receive disjoint global ranges; OpenMP threads divide each rank's range. MPI reduces tallies and reports the maximum rank wall time. Logs include actual rank/thread ranges and timings. No cluster was accessed by this project.

For strong scaling, compare the same N, seed and physics using the same compiler/build and machine/allocation. Record placement, CPU model, allocation, clock/power conditions and compiler options with your exported experiment. Native speedup uses a matched one-worker baseline with the same engine, environment, machine and physical inputs. To compare a local PC and a different HPC machine, read absolute runtimes/throughput side by side; these are not a controlled core-count speedup experiment. Browser/native performance is intentionally kept separate.

## Model and reproducibility

- Homogeneous slab, infinite in y/z, vacuum boundaries at x=0 and x=L; monoenergetic forward source.
- Free flight: `s = -ln(U) / sigma`, with U strictly in (0,1). Boundary distance is tested before a collision. Sigma=0 is vacuum.
- Absorb with probability p, depositing all remaining energy locally; otherwise choose an isotropic 3D direction. Elastic scattering preserves energy. This is a neutral-particle teaching model. The photon label uses exactly this surrogate, not a real photon physics model.
- Final outcomes: transmitted, reflected, absorbed, or collision-cap termination. Scattering counts events and overlaps with escape histories; it is never an exclusive fourth physical outcome.
- Safety cap: 10,000 collisions/history. Capped energy is retained as residual. `incident = deposited + escaped + residual`.
- A hashed `(uint32 seed, global history ID)` initializes xorshift32. Both implementations use the same integer operations. Scheduling does not change a history's stream. Floating-point library and compiler differences can occasionally alter boundary decisions. Floating sums are order-dependent. This RNG is educational, not a certified large-scale independent-stream generator.
- Browser work units contain 4,096 histories. Exported checkpoints contain aggregate tallies and completed chunk IDs. Checkpoints are not cryptographically authenticated. Import clears historical visualization samples; only newly calculated sample IDs will be displayed after resumption.
- Visualization offsets the 384 sample sources to separate paths. The physics uses a pencil beam. The heatmap projects x/y; transverse positions beyond ±L/2 collect at edge rows. Paths are clipped to the viewport and capped at 256 displayed vertices. Numerical tallies continue after the displayed path limit.
- Presets (concrete/water/lead) are illustrative coefficients, not sourced material data. Energy does not change coefficients. There are no secondaries, energy-dependent cross sections, Compton scattering, dose estimates, variance reduction, GPU kernels or production cross-section libraries.

Method references: [OpenMC free-flight sampling](https://docs.openmc.org/en/v0.11.0/methods/neutron_physics.html), [MPI timing](https://docs.open-mpi.org/en/v5.0.6/man-openmpi/man3/MPI_Wtime.3.html), [MPI reductions](https://docs.open-mpi.org/en/v5.0.8/man-openmpi/man3/MPI_Reduce.3.html).

## What is measured

Browser wall time includes construction, startup, chunk messaging, computation and tally merges. Worker occupancy is summed worker compute time divided by workers × wall time. It is **not** OS CPU load. Browser memory and OS core utilization are unavailable and remain blank. Bounded result arrays and sampled tracks mean memory is not proportional to N, although checkpoint chunk IDs grow with N.

Native wall time covers the transport region and reductions, excluding process launch and MPI initialization. The benchmark runner separately records launch-inclusive wall time. Native process CPU time comes from the operating system, divided by wall time × allocated workers. Memory is the sum of rank peak RSS (Linux/macOS) or peak working sets (Windows); it is not total cluster RAM or simultaneous peak usage. The native kernel includes stderr assignment/completion logging; keep logging conditions consistent. Per-thread timings measure active region duration, not per-core utilization. Rank 0 compute/reduction times are included as profiling detail.

For a presentation, set a human waiting budget and use measured median throughput to project histories within that time. Projection is explicitly an extrapolation, not a measured maximum. Startup overhead dominates small runs; thermal throttling and contention may change large-run throughput. Prefer a larger N and at least three repeats for stable measurements. HPC results stay empty until real output is imported.

## Tests

```sh
npm test
node tests/native-parity.mjs native/radiant.exe
```

The core tests cover vacuum transport, Beer–Lambert pure absorption within statistical uncertainty, conservation, outcome exclusivity, partition invariance, RNG behavior, invalid inputs and pure scattering. Native parity checks compare integer tallies and depth distributions with JavaScript and across thread counts. Build the native executable first. MPI requires a real MPI runtime and must be verified on the target cluster; use the repeated native benchmark to detect outcome mismatches.

See `VALIDATION.md` for the checks actually performed in this environment. Source files: `dist/engine.js` (physics), `dist/worker.js` (worker entry), `dist/app.js` (workflow/rendering), `native/radiant.cpp` (OpenMP/MPI engine), `native/benchmark.py` (repeatable sweeps).
For the MinGW installation on this Windows PC, `powershell -File native/build-windows.ps1` builds the tested native executable. Keep the compiler runtime DLLs on PATH when running it.


Resource metrics in grouped rows come from the last repeat; runtime is the median and the range is shown. Short native runs can report slightly above 100% normalized CPU activity because OS CPU accounting has coarser resolution than elapsed time. Longer repeated runs reduce this effect.


## Animation and expanded presets

The visualizer loops up to 384 actual sampled histories with moving heads, fading tails and collision rings. Choose 96, 192 or 384 visible histories, playback speed (0.25–4×), path guides, or pause. Replaying paths never increments transport tallies. Playback timing, source spreading and exit extensions are visual only. Reduced-motion preferences start in a static mode.

Material presets: concrete, water, lead, aluminum, steel, copper, tungsten, graphite, polyethylene, air and vacuum, plus a custom medium. All non-vacuum coefficients are illustrative. Beam presets: neutral test particle, gamma photon surrogate, X-ray photon surrogate, fast neutron and low-energy neutron. Beam presets set energy and color; they do not add species-specific collision physics or energy-dependent cross sections.

