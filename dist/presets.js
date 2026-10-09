// Illustrative teaching coefficients only, independent of beam species/energy.
export const MATERIALS={
 concrete:{name:'Concrete',sigma:.35,absorb:.25,color:'#8ebbe5',note:'Balanced collision and absorption example.'},
 water:{name:'Water',sigma:.16,absorb:.08,color:'#47bfff',note:'A transparent blue slab with a scattering-heavy preset.'},
 lead:{name:'Lead',sigma:.7,absorb:.6,color:'#b4a8e8',note:'An absorption-heavy illustration with shallow penetration.'},
 aluminum:{name:'Aluminum',sigma:.22,absorb:.18,color:'#c1d9ed',note:'A light-metal illustration with moderate interaction rate.'},
 steel:{name:'Steel',sigma:.48,absorb:.38,color:'#8aacc2',note:'A metal illustration between concrete and lead.'},
 copper:{name:'Copper',sigma:.55,absorb:.42,color:'#ee9b65',note:'A copper-colored slab with a higher absorption fraction.'},
 tungsten:{name:'Tungsten',sigma:.85,absorb:.65,color:'#a6b0d1',note:'The strongest absorber in this teaching preset collection.'},
 graphite:{name:'Graphite',sigma:.28,absorb:.025,color:'#839baa',note:'Repeated scattering with relatively little absorption.'},
 polyethylene:{name:'Polyethylene',sigma:.32,absorb:.045,color:'#84e4c7',note:'A scattering-heavy polymer illustration; no moderation physics.'},
 air:{name:'Air',sigma:.004,absorb:.03,color:'#8ed8ed',note:'Few interactions over a short slab.'},
 vacuum:{name:'Vacuum',sigma:0,absorb:0,color:'#6589bc',note:'A useful reference: every particle crosses without a collision.'},
 custom:{name:'Custom medium',color:'#b895ff',note:'Set your own interaction rate and absorption probability.'}
};
export const BEAMS={
 neutral:{name:'Neutral test particle',energy:1,color:'#b9dcff',note:'Generic elastic transport at 1 MeV.'},
 photon:{name:'Gamma photon · surrogate',energy:1,color:'#dbb4ff',note:'1 MeV beam preset. Elastic surrogate; no Compton or photoelectric physics.'},
 xray:{name:'X-ray photon · surrogate',energy:.08,color:'#ffb8eb',note:'80 keV beam preset. Uses the same elastic surrogate as gamma photons.'},
 neutron:{name:'Fast neutron · elastic',energy:2,color:'#80eeff',note:'2 MeV beam preset. Elastic isotropic scattering; no energy loss or secondaries.'},
 neutron_low:{name:'Low-energy neutron · elastic',energy:.001,color:'#e4ff9e',note:'1 keV beam preset, not a thermal neutron. No moderation or energy-dependent cross sections.'}
};
