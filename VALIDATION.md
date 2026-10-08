# Validation record · 8 October 2026

## Executed successfully

- Seven automated JavaScript transport tests: vacuum, analytical pure absorption, outcome and energy conservation, all-history tallies, reordered partition invariance, deterministic RNG, invalid controls and pure scattering.
- Native OpenMP build with installed MinGW GCC 6.3.0, optimized C++11. The installed linker needed the two-stage build in `native/build-windows.ps1`.
- Twelve native/JavaScript comparisons: four physics cases × 1, 2 and 4 OpenMP threads, 100,000 histories each. Final integer outcomes and every collision-depth bin matched exactly.
- One-history native vacuum case produced finite JSON timing after switching Windows elapsed timing to QueryPerformanceCounter.
- Nine measured native runs of 1,000,000 histories: three repeats each for 1, 2 and 4 threads. All outcome counts were identical. Raw measurements are in `native/local-measurements.json`.
- Browser default run completed 100,000 histories with 8,930 transmitted, 66,875 absorbed, 24,195 reflected, 202,149 scattering events and no capped histories.
- Browser checkpoint import resumed from one completed 4,096-history chunk and finished all 100,000 histories. Resumed measurements are marked and excluded from scaling baselines.
- Interactive dashboard checked in the Codex browser; material, energy, history and worker controls were usable and completed runs.

## Native measurements

The original nine-run measurement file used the installed compiler's steady clock, with approximately millisecond timing granularity. The final engine uses a higher-resolution Windows timer; parity was rechecked after that change.

| OpenMP threads | Median transport wall time | Speedup versus 1 thread |
|---|---:|---:|
| 1 | 0.333346 s | 1.00× |
| 2 | 0.167522 s | 1.99× |
| 4 | 0.085510 s | 3.90× |

Inputs: seed 42, slab 10 cm, cross section 0.35 cm⁻¹, absorption 0.25, energy 1 MeV. Host identifier and compiler are recorded in the measurement JSON. These values describe this PC during this test, not a universal expected speedup or a cluster result.

## Not verified here

- MPI execution, Slurm allocation and multi-node scaling: no cluster was connected. The MPI code, CMake option, repeated sweep and Slurm example must be validated on the target installation.
- Production radiation accuracy: material presets and elastic scattering are educational simplifications, not validated cross-section data.
- Whole-system CPU utilization or browser process memory: the browser cannot measure these; worker occupancy is explicitly labelled.
- Billion-history execution: supported as an input range, but not run during verification. Waiting-budget estimates are extrapolations from actual smaller measurements.

- Final browser guided sweep completed all 27 runs; native import accepted all nine measurements. Browser export is preserved in browser-and-native-measurements.json. No browser console errors were reported. At 1M histories, browser medians were 0.4209 s (one worker) and 0.1274 s (four workers), a measured 3.30× speedup. At 10K histories, four workers were slower than one, demonstrating startup overhead.


