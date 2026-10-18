#include "AEConfig.h"
#include "AE_EffectVers.h"
#ifndef BRUXOS_LANGUAGE
#define BRUXOS_LANGUAGE 0
#endif
#if BRUXOS_LANGUAGE == 2
#define BRUXOS_EFFECT_NAME "Bruxosdovfx 散焦"
#elif BRUXOS_LANGUAGE == 1
#define BRUXOS_EFFECT_NAME "Bruxosdovfx Defocus"
#else
#define BRUXOS_EFFECT_NAME "Bruxosdovfx Desfoque"
#endif
resource 'PiPL'  (16000) {
 {Kind {AEEffect},Name {BRUXOS_EFFECT_NAME},Category {"Bruxosdovfx"},CodeWin64X86 {"EffectMain"},
 AE_PiPL_Version {2,0},AE_Effect_Spec_Version {PF_PLUG_IN_VERSION,PF_PLUG_IN_SUBVERS},
 AE_Effect_Version {98817},AE_Effect_Info_Flags {0},
 AE_Effect_Global_OutFlags {0x06008000},AE_Effect_Global_OutFlags_2 {0x00001408},
 AE_Effect_Match_Name {"Bruxosdovfx DepthLens"},AE_Reserved_Info {0}}
};
