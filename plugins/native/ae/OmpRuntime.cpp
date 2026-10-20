// Minimal OpenMP runtime for the macOS (and Linux test) builds of the plugins.
// Apple's toolchain ships no libomp, and a static libomp aborts the host with
// "OMP: Error #15" when Resolve or another plugin already loaded its own copy.
// This file implements only what clang emits for the engine's plain
// "#pragma omp parallel for" loops: fork/join plus static scheduling. Any other
// OpenMP construct leaves an undefined __kmpc_* symbol, so it fails at link time.
// Compile with -fvisibility=hidden: these symbols must stay private to the plugin.
#include <algorithm>
#include <array>
#include <condition_variable>
#include <cstdarg>
#include <cstdint>
#include <cstdlib>
#include <functional>
#include <memory>
#include <mutex>
#include <thread>
#include <type_traits>
#include <utility>
#include <vector>
#include <pthread.h>
namespace {
using Micro=void(*)(int32_t*,int32_t*,...);
using Arg=void*;
// Captures per parallel region; the engine uses at most 23. build-macos.sh checks the compiled
// sources so a region with more captures fails the build instead of aborting the host.
constexpr int maxArgs=64;
struct Task{Micro fn=nullptr;int argc=0,threads=1;Arg args[maxArgs]{};};
thread_local int teamId=0,teamSize=1;thread_local bool inParallel=false;

// The outlined region is a normal (non-variadic) function taking argc pointer-sized captures.
template<size_t> using Slot=Arg;
template<size_t... I> void call(Micro fn,int32_t* gtid,int32_t* btid,const Arg* a,std::index_sequence<I...>){reinterpret_cast<void(*)(int32_t*,int32_t*,Slot<I>...)>(fn)(gtid,btid,a[I]...);}
using Caller=void(*)(Micro,int32_t*,int32_t*,const Arg*);
template<size_t N> void callN(Micro fn,int32_t* gtid,int32_t* btid,const Arg* a){call(fn,gtid,btid,a,std::make_index_sequence<N>{});}
template<size_t... N> constexpr std::array<Caller,sizeof...(N)> callers(std::index_sequence<N...>){return {callN<N>...};}
constexpr auto invokers=callers(std::make_index_sequence<maxArgs+1>{});

void invoke(const Task& t,int id){
 int savedId=teamId,savedSize=teamSize;bool savedParallel=inParallel;
 teamId=id;teamSize=t.threads;inParallel=true;int32_t gtid=id,btid=id;
 invokers[t.argc](t.fn,&gtid,&btid,t.args);
 teamId=savedId;teamSize=savedSize;inParallel=savedParallel;
}
int threadCount(){
 if(const char* env=std::getenv("OMP_NUM_THREADS")){int n=std::atoi(env);if(n>0)return std::min(n,256);}
 return int(std::max(1u,std::min(256u,std::thread::hardware_concurrency())));
}

// macOS gives std::thread 512 KB of stack (libomp workers get 4 MB): use 8 MB, like a main thread.
bool spawn(pthread_t& id,std::function<void()> body){
 auto heap=new std::function<void()>(std::move(body));pthread_attr_t attr;pthread_attr_init(&attr);pthread_attr_setstacksize(&attr,size_t(8)<<20);
 int failed=pthread_create(&id,&attr,[](void* p)->void*{std::unique_ptr<std::function<void()>> f(static_cast<std::function<void()>*>(p));(*f)();return nullptr;},heap);
 pthread_attr_destroy(&attr);if(failed)delete heap;return !failed;
}

// Persistent workers for the first host thread; a concurrent host thread gets a temporary team.
class Pool{
 std::mutex m;std::condition_variable wake,done;std::vector<pthread_t> workers;const Task* task=nullptr;unsigned generation=0;int pending=0;bool stop=false;
 void loop(int id){unsigned seen=0;for(;;){const Task* t;{std::unique_lock<std::mutex> lock(m);wake.wait(lock,[&]{return stop||generation!=seen;});if(stop)return;seen=generation;t=task;}
  if(id<t->threads)invoke(*t,id);std::lock_guard<std::mutex> lock(m);if(--pending==0)done.notify_one();}}
public:
 std::mutex busy;
 Pool(){int n=threadCount();for(int i=1;i<n;i++){pthread_t id;if(!spawn(id,[this,i]{loop(i);}))break;workers.push_back(id);}}
 ~Pool(){{std::lock_guard<std::mutex> lock(m);stop=true;}wake.notify_all();for(auto id:workers)pthread_join(id,nullptr);}
 int size()const{return int(workers.size())+1;}
 void run(const Task& t){{std::lock_guard<std::mutex> lock(m);task=&t;pending=int(workers.size());generation++;}wake.notify_all();invoke(t,0);std::unique_lock<std::mutex> lock(m);done.wait(lock,[&]{return pending==0;});}
};

// Same partition as libomp's kmp_sch_static (balanced) and kmp_sch_static_chunked.
template<class T,class S> void staticInit(int32_t schedule,int32_t* last,T* lower,T* upper,S* stride,S incr,S chunk){
 using U=std::make_unsigned_t<T>;const int id=teamId,n=teamSize;schedule&=~(int32_t(1)<<29|int32_t(1)<<30);// monotonic modifiers
 if(incr==0)std::abort();
 if(incr>0?*upper<*lower:*lower<*upper){if(last)*last=0;*stride=incr;return;}
 U trips=incr>0?U(U(*upper-*lower)/U(incr)+1):U(U(*lower-*upper)/U(-incr)+1);
 if(n==1){if(last)*last=1;*stride=incr>0?S(*upper-*lower+1):S(-(*lower-*upper+1));return;}
 if(schedule==33){if(chunk<1)chunk=1;S span=chunk*incr;*stride=span*n;*lower=*lower+span*id;*upper=*lower+span-incr;if(last)*last=id==int((trips-1)/U(chunk)%U(n));return;}
 if(schedule!=34){if(id!=0)*lower=*upper+(incr>0?1:-1);if(last)*last=id==0;*stride=S(trips);return;}
 if(trips<U(n)){if(U(id)<trips)*upper=*lower=*lower+id*incr;else *lower=*upper+(incr>0?1:-1);if(last)*last=U(id)==trips-1;}
 else{U small=trips/U(n),extras=trips%U(n),before=U(id)*small+(U(id)<extras?U(id):extras);*lower=T(*lower+incr*S(before));*upper=T(*lower+S(small)*incr-(U(id)<extras?0:incr));if(last)*last=id==n-1;}
 *stride=S(trips);
}
}

extern "C" {
void __kmpc_fork_call(void*,int32_t argc,Micro fn,...){
 if(argc<0||argc>maxArgs)std::abort();
 Task t;t.fn=fn;t.argc=argc;va_list list;va_start(list,fn);for(int i=0;i<argc;i++)t.args[i]=va_arg(list,Arg);va_end(list);
 if(inParallel){invoke(t,0);return;}
 static Pool pool;t.threads=pool.size();
 std::unique_lock<std::mutex> lock(pool.busy,std::try_to_lock);
 if(lock){pool.run(t);return;}
 std::vector<pthread_t> team;int spawned=1;for(;spawned<t.threads;spawned++){pthread_t id;if(!spawn(id,[&t,i=spawned]{invoke(t,i);}))break;team.push_back(id);}
 invoke(t,0);for(int i=spawned;i<t.threads;i++)invoke(t,i);// ids no new thread could take
 for(auto id:team)pthread_join(id,nullptr);
}
void __kmpc_for_static_init_4(void*,int32_t,int32_t schedule,int32_t* last,int32_t* lower,int32_t* upper,int32_t* stride,int32_t incr,int32_t chunk){staticInit(schedule,last,lower,upper,stride,incr,chunk);}
void __kmpc_for_static_init_4u(void*,int32_t,int32_t schedule,int32_t* last,uint32_t* lower,uint32_t* upper,int32_t* stride,int32_t incr,int32_t chunk){staticInit(schedule,last,lower,upper,stride,incr,chunk);}
void __kmpc_for_static_init_8(void*,int32_t,int32_t schedule,int32_t* last,int64_t* lower,int64_t* upper,int64_t* stride,int64_t incr,int64_t chunk){staticInit(schedule,last,lower,upper,stride,incr,chunk);}
void __kmpc_for_static_init_8u(void*,int32_t,int32_t schedule,int32_t* last,uint64_t* lower,uint64_t* upper,int64_t* stride,int64_t incr,int64_t chunk){staticInit(schedule,last,lower,upper,stride,incr,chunk);}
void __kmpc_for_static_fini(void*,int32_t){}
}
