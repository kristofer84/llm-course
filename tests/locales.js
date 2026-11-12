/* Locale selection/formatting contracts, using vendored i18next without a browser. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const vendor=fs.readFileSync(path.join(root,'src/vendor/i18next.min.js'),'utf8');
const engine=fs.readFileSync(path.join(root,'src/i18n/engine.js'),'utf8').replace(/<\/?script>/g,'');
function start({query='',saved=null,languages=['en-US'],language='en-US'}={}){
  const state=new Map(saved?[['llm-kurs-lang',saved]]:[]);
  let replacement=null;
  const context=vm.createContext({console,Intl,URL,setTimeout,clearTimeout,
    I18N_DATA:{sv:{'test.term':'Svenska'},de:{'test.term':'Deutsch'},en:{'test.term':'English'}},
    navigator:{languages,language},
    localStorage:{getItem:k=>state.get(k)||null,setItem:(k,v)=>state.set(k,v)},
    document:{getElementById:()=>null,documentElement:{lang:'sv'}},
    location:{search:query,hash:'#s12',pathname:'/llm-kurs.html',
      href:'file:///llm-kurs.html'+query+'#s12',replace:value=>{replacement=value;}}
  });
  context.window=context;
  vm.runInContext(vendor,context);
  vm.runInContext(engine,context);
  return {L:context.L,state,replacement:()=>replacement};
}
const cases=[
  [{query:'?lang=sv',saved:'de',languages:['de-DE']},'sv'],
  [{query:'?lang=de',saved:'en',languages:['sv-SE']},'de'],
  [{query:'?lang=DE-DE',languages:['en-US']},'de'],
  [{query:'?lang=de_AT',languages:['en-US']},'de'],
  [{query:'?lang=fr',saved:'de',languages:['en-US']},'de'],
  [{saved:'sv',languages:['de-DE']},'sv'],
  [{languages:['de-DE','en-US']},'de'],
  [{languages:['de-AT']},'de'],
  [{languages:['fr-CA','de-CH','en-US']},'de'],
  [{languages:['fr-FR','en-GB','de-DE']},'en'],
  [{languages:['fr-FR']},'en'],
  [{languages:[],language:'de-DE'},'de'],
];
for(const [options,expected] of cases){
  const {L}=start(options);assert.equal(L.lang,expected,JSON.stringify(options));
  assert.equal(JSON.stringify(L.languages),JSON.stringify(['sv','en','de']));
}
const german=start({query:'?lang=de&theme=dark'});
assert.equal(german.L.t('test.term'),'Deutsch');
assert.equal(german.L.num(1234.5,1),'1.234,5');
german.L.setLang('en');
assert.equal(german.state.get('llm-kurs-lang'),'en');
const switched=new URL(german.replacement());
assert.equal(switched.searchParams.get('lang'),'en');
assert.equal(switched.searchParams.get('theme'),'dark');
assert.equal(switched.hash,'#s12');
console.log(`OK: ${cases.length} locale precedence/detection cases; German formatting and hash-preserving switching`);
