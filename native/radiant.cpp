#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <iomanip>
#include <vector>
#include <string>
#include <chrono>
#include <limits>
#include <stdexcept>
#include <algorithm>
#include <cctype>
#ifndef __VERSION__
#define __VERSION__ "C++ compiler"
#endif
#include <omp.h>
#ifdef RADIANT_MPI
#include <mpi.h>
#endif
#ifdef _WIN32
#include <windows.h>
#include <psapi.h>
#else
#include <sys/resource.h>
#include <unistd.h>
#endif
using Clock=std::chrono::steady_clock;
double now(){
#ifdef _WIN32
 LARGE_INTEGER count,freq;QueryPerformanceCounter(&count);QueryPerformanceFrequency(&freq);return double(count.QuadPart)/double(freq.QuadPart);
#else
 return std::chrono::duration<double>(Clock::now().time_since_epoch()).count();
#endif
}
struct RNG { uint32_t s; RNG(uint32_t seed,uint32_t id){s=seed^((id+1u)*0x9e3779b9u);s^=s>>16;s*=0x85ebca6bu;s^=s>>13;s*=0xc2b2ae35u;s^=s>>16;if(!s)s=1;} double next(){s^=s<<13;s^=s>>17;s^=s<<5;return (double(s)+.5)/4294967296.0;} };
double cpu(){
#ifdef _WIN32
 FILETIME a,b,c,d;GetProcessTimes(GetCurrentProcess(),&a,&b,&c,&d);ULARGE_INTEGER k,u;k.LowPart=c.dwLowDateTime;k.HighPart=c.dwHighDateTime;u.LowPart=d.dwLowDateTime;u.HighPart=d.dwHighDateTime;return (k.QuadPart+u.QuadPart)*1e-7;
#else
 struct rusage r;getrusage(RUSAGE_SELF,&r);return r.ru_utime.tv_sec+r.ru_utime.tv_usec*1e-6+r.ru_stime.tv_sec+r.ru_stime.tv_usec*1e-6;
#endif
}
double memory(){
#ifdef _WIN32
 PROCESS_MEMORY_COUNTERS p;GetProcessMemoryInfo(GetCurrentProcess(),&p,sizeof(p));return p.PeakWorkingSetSize/1048576.0;
#else
 struct rusage r;getrusage(RUSAGE_SELF,&r);
#ifdef __APPLE__
 return r.ru_maxrss/1048576.0;
#else
 return r.ru_maxrss/1024.0;
#endif
#endif
}
std::string host(){char b[256]={0};
#ifdef _WIN32
 DWORD n=255;GetComputerNameA(b,&n);
#else
 gethostname(b,255);
#endif
 std::string s(b);for(char &c:s)if(!(std::isalnum(static_cast<unsigned char>(c))||c=='-'||c=='.'||c=='_'))c='_';return s;}
double number(const char *s){size_t pos;std::string str(s);double v=std::stod(str,&pos);if(pos!=str.size()||!std::isfinite(v))throw std::runtime_error("Invalid number");return v;}
int main(int argc,char**argv){int rank=0,ranks=1;
#ifdef RADIANT_MPI
 MPI_Init(&argc,&argv);MPI_Comm_rank(MPI_COMM_WORLD,&rank);MPI_Comm_size(MPI_COMM_WORLD,&ranks);
#endif
 try {if(argc<8||argc>9)throw std::runtime_error("Usage: radiant N seed thickness sigma absorb energy threads [local|hpc]");double nd=number(argv[1]),sd=number(argv[2]),L=number(argv[3]),sigma=number(argv[4]),absorb=number(argv[5]),energy=number(argv[6]),td=number(argv[7]);std::string env=argc==9?argv[8]:"local";if(nd<1||nd>1e9||std::floor(nd)!=nd||sd<0||sd>4294967295.0||std::floor(sd)!=sd||L<.01||L>100||sigma<0||sigma>100||absorb<0||absorb>1||energy<.001||energy>1000||td<1||td>1024||std::floor(td)!=td||(env!="local"&&env!="hpc"))throw std::runtime_error("Parameters outside supported range");uint64_t N=uint64_t(nd);uint32_t seed=uint32_t(sd);int threads=int(td);omp_set_dynamic(0);omp_set_num_threads(threads);
 // 0..3 outcomes; 4 scattering; 5 collisions; 6 path; 7 deposited;
 // 8 escaped; 9 residual; 10..49 depth; 50..689 heat.
 const int SZ=690;std::vector<double> tally(SZ,0),threadSeconds(threads,0);uint64_t rankStart=N*rank/ranks,rankEnd=N*(rank+1)/ranks;int actualThreads=1;
#ifdef RADIANT_MPI
 MPI_Barrier(MPI_COMM_WORLD);
#endif
 const double cpuStart=cpu();auto start=now();
#pragma omp parallel
 {int tid=omp_get_thread_num(),nt=omp_get_num_threads();
#pragma omp single
 actualThreads=nt;
 uint64_t begin=rankStart+(rankEnd-rankStart)*tid/nt,end=rankStart+(rankEnd-rankStart)*(tid+1)/nt;std::vector<double> local(SZ,0);auto ts=now();
#pragma omp critical
 std::cerr<<"rank "<<rank<<" thread "<<tid<<" histories ["<<begin<<", "<<end<<") seed "<<seed<<"\n";
 for(uint64_t id=begin;id<end;id++){RNG rng(seed,uint32_t(id));double x=0,y=0,z=0,dx=1,dy=0,dz=0;int outcome=3,steps=0;while(steps<10000){double u=rng.next(),distance=sigma==0?std::numeric_limits<double>::infinity():-std::log(u)/sigma;double boundary=dx>0?(L-x)/dx:dx<0?-x/dx:std::numeric_limits<double>::infinity();double travel=std::min(distance,boundary);x+=dx*travel;y+=dy*travel;z+=dz*travel;local[6]+=travel;if(boundary<=distance){outcome=dx>0?0:2;local[8]+=energy;break;}steps++;local[5]++;int bin=std::min(39,std::max(0,int(std::floor(x/L*40))));local[10+bin]++;double choice=rng.next();if(choice<absorb){outcome=1;local[7]+=energy;int row=std::min(15,std::max(0,int(std::floor((y/L+.5)*16))));local[50+row*40+bin]+=energy;break;}local[4]++;dx=2*rng.next()-1;double phi=2*3.14159265358979323846*rng.next(),s=std::sqrt(1-dx*dx);dy=s*std::cos(phi);dz=s*std::sin(phi);}if(outcome==3)local[9]+=energy;local[outcome]++;}
 threadSeconds[tid]=now()-ts;
#pragma omp critical
 {for(int i=0;i<SZ;i++)tally[i]+=local[i];std::cerr<<"rank "<<rank<<" thread "<<tid<<" complete "<<(end-begin)<<" histories in "<<threadSeconds[tid]<<" s\n";}
 }
 double computeSeconds=now()-start;auto rt=now();std::vector<double> total(SZ,0);double rss=memory(),cpusec=cpu()-cpuStart,allCpu=cpusec,allRss=rss;int allWorkers=actualThreads;
#ifdef RADIANT_MPI
 MPI_Reduce(tally.data(),total.data(),SZ,MPI_DOUBLE,MPI_SUM,0,MPI_COMM_WORLD);
 MPI_Reduce(&cpusec,&allCpu,1,MPI_DOUBLE,MPI_SUM,0,MPI_COMM_WORLD);
 MPI_Reduce(&rss,&allRss,1,MPI_DOUBLE,MPI_SUM,0,MPI_COMM_WORLD);
 MPI_Reduce(&actualThreads,&allWorkers,1,MPI_INT,MPI_SUM,0,MPI_COMM_WORLD);
#else
 total=tally;
#endif
 double reduceSeconds=now()-rt,wall=now()-start,maxWall=wall;
#ifdef RADIANT_MPI
 MPI_Reduce(&wall,&maxWall,1,MPI_DOUBLE,MPI_MAX,0,MPI_COMM_WORLD);
#endif
 if(rank==0){std::cout<<std::setprecision(17)<<"{\"schema\":1,\"model\":\"slab-elastic-v1\",\"engine\":\"native\",\"environment\":\""<<env<<"\",\"machine\":\""<<host()<<"\",\"compiler\":\""<<__VERSION__<<"\",\"params\":{\"n\":"<<N<<",\"seed\":"<<seed<<",\"thickness\":"<<L<<",\"sigma\":"<<sigma<<",\"absorb\":"<<absorb<<",\"energy\":"<<energy<<",\"particle\":\"neutral\"},\"workers\":"<<allWorkers<<",\"threads\":"<<actualThreads<<",\"ranks\":"<<ranks<<",\"wallSeconds\":"<<maxWall<<",\"throughput\":"<<N/maxWall<<",\"cpuSeconds\":"<<allCpu<<",\"cpuUtilization\":"<<allCpu/(maxWall*allWorkers)<<",\"memoryMB\":"<<allRss<<",\"memoryMetric\":\"sum of rank peak RSS / working sets\",\"rank0ComputeSeconds\":"<<computeSeconds<<",\"rank0ReduceSeconds\":"<<reduceSeconds<<",\"counts\":{\"transmitted\":"<<total[0]<<",\"absorbed\":"<<total[1]<<",\"reflected\":"<<total[2]<<",\"capped\":"<<total[3]<<",\"scatter\":"<<total[4]<<",\"collisions\":"<<total[5]<<"},\"energy\":{\"deposited\":"<<total[7]<<",\"escaped\":"<<total[8]<<",\"residual\":"<<total[9]<<"},\"depth\":[";for(int i=0;i<40;i++)std::cout<<(i?",":"")<<total[10+i];std::cout<<"],\"threadSecondsRank0\":[";for(int i=0;i<actualThreads;i++)std::cout<<(i?",":"")<<threadSeconds[i];std::cout<<"]}\n";}
#ifdef RADIANT_MPI
 MPI_Finalize();
#endif
 return 0;
 }catch(const std::exception&e){if(rank==0)std::cerr<<e.what()<<"\n";
#ifdef RADIANT_MPI
 MPI_Abort(MPI_COMM_WORLD,2);
#endif
 return 2;}}

