#!/bin/bash
#SBATCH --job-name=radiant
#SBATCH --nodes=2
#SBATCH --ntasks=4
#SBATCH --cpus-per-task=4
#SBATCH --time=00:15:00
#SBATCH --output=radiant-%j.log
set -euo pipefail
# Load your site's compiler, CMake, Python and MPI modules before submission.
export OMP_PROC_BIND=close
export OMP_PLACES=cores
cmake -S native -B native/build-mpi -DRADIANT_MPI=ON -DCMAKE_BUILD_TYPE=Release
cmake --build native/build-mpi -j 4
# mpirun must integrate with your site's Slurm installation. Adapt launcher if needed.
python3 native/benchmark.py --exe native/build-mpi/radiant --mpi --environment hpc --ranks 1 2 4 --threads 1 2 4 --n 10000000 --output hpc-measurements.json
